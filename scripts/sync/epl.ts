import {
  fetchCalendar,
  fetchMatchweekFixtures,
  fetchMatchSummary,
  fetchStandings,
  fetchNews,
  groupMatchweeks,
  currentMatchweekIndex,
  type ESPNFixture,
} from "./lib/espn.ts";

import {
  upsertTeam,
  upsertFixture,
  getTeamDbIds,
  hasMatchStats,
  upsertMatchStats,
  hasStandingsSnapshot,
  insertStandingsSnapshot,
  upsertNews,
  logSync,
} from "./lib/db.ts";

async function syncEPL() {
  console.log(`[sync:epl] ${new Date().toISOString()} — starting`);

  // 1. Calendar → matchweeks
  const { calendar, season } = await fetchCalendar();
  const matchweeks = groupMatchweeks(calendar);
  const mwIndex = currentMatchweekIndex(matchweeks);

  // Sync current + previous matchweek (handles fixtures finishing after midnight)
  const indices = [mwIndex];
  if (mwIndex > 0) indices.unshift(mwIndex - 1);

  for (const idx of indices) {
    const mw = matchweeks[idx];
    if (!mw) continue;

    console.log(`[sync:epl] syncing ${mw.label} (${mw.start}–${mw.end})`);

    // 2. Fixtures for this matchweek
    const fixtures = await fetchMatchweekFixtures(mw.start, mw.end);

    // 3. Upsert teams + fixtures
    const fixtureDbIds = new Map<string, bigint>();
    const espnTeamIds  = new Set<number>();

    for (const fixture of fixtures) {
      const comp = fixture.competitions[0];
      const home = comp.competitors.find((c) => c.homeAway === "home")!;
      const away = comp.competitors.find((c) => c.homeAway === "away")!;

      const homeDbId = await upsertTeam(home.team);
      const awayDbId = await upsertTeam(away.team);
      espnTeamIds.add(parseInt(home.team.id));
      espnTeamIds.add(parseInt(away.team.id));

      const fixtureDbId = await upsertFixture(fixture, homeDbId, awayDbId, mw.number, season);
      fixtureDbIds.set(fixture.id, fixtureDbId);
    }

    // 4. Match stats for finished fixtures
    const finishedFixtures = fixtures.filter(
      (f) => f.competitions[0].status.type.state === "post"
    );

    const teamDbIds = await getTeamDbIds([...espnTeamIds]);

    for (const fixture of finishedFixtures) {
      const fixtureDbId = fixtureDbIds.get(fixture.id)!;
      if (await hasMatchStats(fixtureDbId)) continue;

      const teamStats = await fetchMatchSummary(fixture.id);
      for (const ts of teamStats) {
        const teamDbId = teamDbIds.get(parseInt(ts.team.id));
        if (!teamDbId) {
          console.warn(`[sync:epl] no DB id for team ${ts.team.id}, skipping match stats`);
          continue;
        }
        await upsertMatchStats(fixtureDbId, teamDbId, ts);
      }
      console.log(`[sync:epl] stats saved for fixture ${fixture.id}`);
    }

    // 5. Standings snapshot when matchweek is complete
    const allFinished = fixtures.length > 0 && fixtures.every(
      (f) => f.competitions[0].status.type.state === "post"
    );

    if (allFinished && !(await hasStandingsSnapshot(season, mw.number))) {
      console.log(`[sync:epl] snapshotting standings for ${mw.label}`);
      const entries = await fetchStandings();
      await insertStandingsSnapshot(entries, teamDbIds, season, mw.number);
    }
  }

  // 6. News (always refresh)
  const articles = await fetchNews();
  for (const article of articles) {
    await upsertNews(article);
  }
  console.log(`[sync:epl] synced ${articles.length} news articles`);

  await logSync("epl", "ok");
  console.log("[sync:epl] done");
}

syncEPL().catch(async (err) => {
  console.error("[sync:epl] error:", err);
  await logSync("epl", "error", String(err)).catch(() => {});
  process.exit(1);
});
