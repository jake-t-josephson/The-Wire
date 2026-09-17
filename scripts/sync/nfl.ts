import { fetchNFLScoreboard, fetchNFLNews } from "./lib/espn.ts";
import { upsertLeague, upsertNFLTeam, upsertNFLGame, upsertNFLNews, logSync } from "./lib/db.ts";

async function syncNFL() {
  console.log(`[sync:nfl] ${new Date().toISOString()} — starting`);

  // 1. Current week scoreboard
  const { week, season, games, leagueLogo } = await fetchNFLScoreboard();
  console.log(`[sync:nfl] week ${week}, season ${season}, ${games.length} games`);

  await upsertLeague({
    slug:        "nfl",
    apiId:       "28",
    name:        "National Football League",
    logoUrl:     leagueLogo,
    darkLogoUrl: leagueLogo,
  });

  // 2. Upsert teams and games
  for (const game of games) {
    const comp = game.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeDbId = await upsertNFLTeam(home.team);
    const awayDbId = await upsertNFLTeam(away.team);
    await upsertNFLGame(game, homeDbId, awayDbId, week, season);
  }
  console.log(`[sync:nfl] upserted ${games.length} games`);

  // 3. News
  const articles = await fetchNFLNews();
  for (const article of articles) {
    await upsertNFLNews(article);
  }
  console.log(`[sync:nfl] synced ${articles.length} news articles`);

  await logSync("nfl", "ok");
  console.log("[sync:nfl] done");
}

syncNFL().catch(async (err) => {
  console.error("[sync:nfl] error:", err);
  await logSync("nfl", "error", String(err)).catch(() => {});
  process.exit(1);
});
