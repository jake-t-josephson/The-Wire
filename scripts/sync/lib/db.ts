import { createClient } from "@supabase/supabase-js";
import type { ESPNTeam, ESPNFixture, ESPNTeamMatchStats, ESPNStandingEntry, ESPNArticle } from "./espn.ts";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Teams ─────────────────────────────────────────────────────────────────────

export async function upsertTeam(team: ESPNTeam): Promise<bigint> {
  const { data, error } = await supabase
    .from("teams")
    .upsert({
      league:     "epl",
      api_id:     parseInt(team.id),
      name:       team.displayName,
      short_name: team.shortDisplayName,
      crest_url:  team.logo,
      colors:     { primary: team.color, secondary: team.alternateColor },
    }, { onConflict: "league,api_id" })
    .select("id")
    .single();
  if (error) throw new Error(`upsertTeam: ${error.message}`);
  return data.id;
}

// Returns map of ESPN team id → DB id for a list of ESPN team ids
export async function getTeamDbIds(espnIds: number[]): Promise<Map<number, bigint>> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, api_id")
    .eq("league", "epl")
    .in("api_id", espnIds);
  if (error) throw new Error(`getTeamDbIds: ${error.message}`);
  return new Map((data ?? []).map((t) => [t.api_id as number, t.id as bigint]));
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function mapStatus(state: string): string {
  if (state === "in")   return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

export async function upsertFixture(
  fixture: ESPNFixture,
  homeTeamId: bigint,
  awayTeamId: bigint,
  matchweek: number,
  season: number
): Promise<bigint> {
  const comp  = fixture.competitions[0];
  const home  = comp.competitors.find((c) => c.homeAway === "home");
  const away  = comp.competitors.find((c) => c.homeAway === "away");
  const state = comp.status.type.state;

  const { data, error } = await supabase
    .from("fixtures")
    .upsert({
      league:       "epl",
      api_id:       parseInt(fixture.id),
      season,
      matchweek,
      round:        `GW${matchweek}`,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff:      fixture.date,
      status:       mapStatus(state),
      home_score:   home?.score && state !== "pre" ? parseInt(home.score) : null,
      away_score:   away?.score && state !== "pre" ? parseInt(away.score) : null,
      venue:        comp.venue?.fullName ?? null,
      updated_at:   new Date().toISOString(),
    }, { onConflict: "api_id" })
    .select("id")
    .single();
  if (error) throw new Error(`upsertFixture ${fixture.id}: ${error.message}`);
  return data.id;
}

// ── Match stats ───────────────────────────────────────────────────────────────

export async function hasMatchStats(fixtureId: bigint): Promise<boolean> {
  const { count } = await supabase
    .from("match_stats")
    .select("id", { count: "exact", head: true })
    .eq("fixture_id", fixtureId);
  return (count ?? 0) >= 2;
}

function stat(statistics: ESPNTeamMatchStats["statistics"], name: string): number | null {
  const s = statistics.find((x) => x.name === name);
  return s ? s.value : null;
}

export async function upsertMatchStats(
  fixtureId: bigint,
  teamId: bigint,
  teamStats: ESPNTeamMatchStats
): Promise<void> {
  const s = teamStats.statistics;
  const { error } = await supabase
    .from("match_stats")
    .upsert({
      fixture_id:      fixtureId,
      team_id:         teamId,
      is_home:         teamStats.homeAway === "home",
      possession:      stat(s, "possessionPct"),
      shots:           stat(s, "totalShots"),
      shots_on_target: stat(s, "shotsOnTarget"),
      saves:           stat(s, "saves"),
      corners:         stat(s, "wonCorners"),
      fouls:           stat(s, "foulsCommitted"),
      yellow_cards:    stat(s, "yellowCards"),
      red_cards:       stat(s, "redCards"),
      offsides:        stat(s, "offsides"),
    }, { onConflict: "fixture_id,team_id" });
  if (error) throw new Error(`upsertMatchStats: ${error.message}`);
}

// ── Standings snapshot ────────────────────────────────────────────────────────

export async function hasStandingsSnapshot(season: number, matchweek: number): Promise<boolean> {
  const { count } = await supabase
    .from("standings_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("league", "epl")
    .eq("season", season)
    .eq("matchweek", matchweek);
  return (count ?? 0) > 0;
}

function standingStat(entry: ESPNStandingEntry, name: string): number {
  return entry.stats.find((s) => s.name === name)?.value ?? 0;
}

export async function insertStandingsSnapshot(
  entries: ESPNStandingEntry[],
  teamDbIds: Map<number, bigint>,
  season: number,
  matchweek: number
): Promise<void> {
  const rows = entries.map((e, i) => {
    const teamId = teamDbIds.get(parseInt(e.team.id));
    if (!teamId) throw new Error(`No DB id for ESPN team ${e.team.id}`);
    return {
      league:        "epl",
      season,
      matchweek,
      team_id:       teamId,
      position:      Math.round(standingStat(e, "rank")) || i + 1,
      played:        Math.round(standingStat(e, "gamesPlayed")),
      won:           Math.round(standingStat(e, "wins")),
      drawn:         Math.round(standingStat(e, "ties")),
      lost:          Math.round(standingStat(e, "losses")),
      goals_for:     Math.round(standingStat(e, "pointsFor")),
      goals_against: Math.round(standingStat(e, "pointsAgainst")),
      goal_diff:     Math.round(standingStat(e, "pointDifferential")),
      points:        Math.round(standingStat(e, "points")),
    };
  });

  const { error } = await supabase
    .from("standings_snapshots")
    .upsert(rows, { onConflict: "league,season,matchweek,team_id" });
  if (error) throw new Error(`insertStandingsSnapshot: ${error.message}`);
}

// ── News ──────────────────────────────────────────────────────────────────────

export async function upsertNews(article: ESPNArticle): Promise<void> {
  const { error } = await supabase
    .from("news_items")
    .upsert({
      league:       "epl",
      title:        article.headline,
      url:          article.links.web.href,
      source:       "ESPN",
      summary:      article.description ?? null,
      published_at: article.published,
    }, { onConflict: "url", ignoreDuplicates: true });
  if (error) throw new Error(`upsertNews: ${error.message}`);
}

// ── Sync log ──────────────────────────────────────────────────────────────────

export async function logSync(feed: string, status: "ok" | "error", message?: string): Promise<void> {
  await supabase.from("sync_log").insert({ feed, status, message: message ?? null });
}
