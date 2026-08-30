import { createClient } from "@supabase/supabase-js";
import type { ESPNFixture, ESPNStandingEntry } from "./espn";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

// ── DB row types ──────────────────────────────────────────────────────────────

interface DbTeam {
  api_id: number;
  name: string;
  short_name: string;
  crest_url: string;
}

interface DbFixture {
  api_id: number;
  kickoff: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: DbTeam;
  away_team: DbTeam;
}

interface DbStanding {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  team: DbTeam;
}

// ── Adapters ──────────────────────────────────────────────────────────────────

function dbFixtureToESPN(row: DbFixture): ESPNFixture {
  const hs = row.home_score;
  const as_ = row.away_score;
  const done = row.status === "finished";
  return {
    id: String(row.api_id),
    date: row.kickoff,
    name: `${row.home_team.short_name} vs ${row.away_team.short_name}`,
    competitions: [{
      status: {
        displayClock: "",
        type: {
          state: done ? "post" : row.status === "live" ? "in" : "pre",
          completed: done,
          shortDetail: done ? "FT" : "",
        },
      },
      competitors: [
        {
          homeAway: "home",
          winner: done && hs !== null && as_ !== null && hs > as_,
          score: hs !== null ? String(hs) : "",
          team: {
            id: String(row.home_team.api_id),
            displayName: row.home_team.name,
            shortDisplayName: row.home_team.short_name,
            abbreviation: "",
            color: "",
            alternateColor: "",
            logo: row.home_team.crest_url,
          },
        },
        {
          homeAway: "away",
          winner: done && hs !== null && as_ !== null && as_ > hs,
          score: as_ !== null ? String(as_) : "",
          team: {
            id: String(row.away_team.api_id),
            displayName: row.away_team.name,
            shortDisplayName: row.away_team.short_name,
            abbreviation: "",
            color: "",
            alternateColor: "",
            logo: row.away_team.crest_url,
          },
        },
      ],
    }],
  };
}

function dbStandingToESPN(row: DbStanding): ESPNStandingEntry {
  const gd = row.goal_diff;
  return {
    team: {
      id: String(row.team.api_id),
      displayName: row.team.name,
      shortDisplayName: row.team.short_name,
      abbreviation: "",
      logos: [{ href: row.team.crest_url }],
    },
    stats: [
      { name: "rank",              displayValue: String(row.position),             value: row.position },
      { name: "gamesPlayed",       displayValue: String(row.played),               value: row.played },
      { name: "wins",              displayValue: String(row.won),                  value: row.won },
      { name: "ties",              displayValue: String(row.drawn),                value: row.drawn },
      { name: "losses",            displayValue: String(row.lost),                 value: row.lost },
      { name: "pointsFor",         displayValue: String(row.goals_for),            value: row.goals_for },
      { name: "pointsAgainst",     displayValue: String(row.goals_against),        value: row.goals_against },
      { name: "pointDifferential", displayValue: gd >= 0 ? `+${gd}` : String(gd), value: gd },
      { name: "points",            displayValue: String(row.points),               value: row.points },
    ],
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchHistoricalFixtures(matchweek: number): Promise<ESPNFixture[]> {
  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      api_id, kickoff, status, home_score, away_score,
      home_team:home_team_id(api_id, name, short_name, crest_url),
      away_team:away_team_id(api_id, name, short_name, crest_url)
    `)
    .eq("league", "epl")
    .eq("matchweek", matchweek)
    .order("kickoff");

  if (error) throw new Error(`fetchHistoricalFixtures: ${error.message}`);
  return ((data ?? []) as unknown as DbFixture[]).map(dbFixtureToESPN);
}

export async function fetchHistoricalStandings(matchweek: number, season: number): Promise<ESPNStandingEntry[]> {
  const { data, error } = await supabase
    .from("standings_snapshots")
    .select(`
      position, played, won, drawn, lost, goals_for, goals_against, goal_diff, points,
      team:team_id(api_id, name, short_name, crest_url)
    `)
    .eq("league", "epl")
    .eq("season", season)
    .eq("matchweek", matchweek)
    .order("position");

  if (error) throw new Error(`fetchHistoricalStandings: ${error.message}`);
  return ((data ?? []) as unknown as DbStanding[]).map(dbStandingToESPN);
}
