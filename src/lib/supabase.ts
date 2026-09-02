import { createClient } from "@supabase/supabase-js";
import type { ESPNFixture, ESPNStandingEntry } from "./espn";
import type { WireroomBrief } from "./articles";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

// ── Wireroom Edge Function ────────────────────────────────────────────────────

export async function fetchWireroom(): Promise<WireroomBrief | null> {
  const { data, error } = await supabase.functions.invoke("wireroom");
  if (error || !data) return null;
  return data as WireroomBrief;
}

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

// ── Team page types ───────────────────────────────────────────────────────────

export interface TeamInfo {
  dbId: number;
  apiId: number;
  name: string;
  shortName: string;
  crestUrl: string;
}

export interface TeamFixture {
  apiId: number;
  matchweek: number;
  kickoff: string;
  status: string;
  isHome: boolean;
  teamScore: number | null;
  oppScore: number | null;
  opponent: TeamInfo;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchHistoricalFixtures(matchweek: number): Promise<ESPNFixture[]> {
  // Two queries to avoid PostgREST ambiguity with multiple FKs to teams table
  const { data: fixtureRows, error: fErr } = await supabase
    .from("fixtures")
    .select("api_id, kickoff, status, home_score, away_score, home_team_id, away_team_id")
    .eq("league", "epl")
    .eq("matchweek", matchweek)
    .order("kickoff");

  if (fErr) throw new Error(`fetchHistoricalFixtures: ${fErr.message}`);
  if (!fixtureRows || fixtureRows.length === 0) return [];

  const teamIds = [...new Set(fixtureRows.flatMap((f) => [f.home_team_id, f.away_team_id]))];

  const { data: teamRows, error: tErr } = await supabase
    .from("teams")
    .select("id, api_id, name, short_name, crest_url")
    .in("id", teamIds);

  if (tErr) throw new Error(`fetchHistoricalFixtures teams: ${tErr.message}`);
  const teamMap = new Map((teamRows ?? []).map((t) => [t.id as number, t as DbTeam & { id: number }]));

  return fixtureRows.map((f) => {
    const ht = teamMap.get(f.home_team_id as number);
    const at = teamMap.get(f.away_team_id as number);
    if (!ht || !at) throw new Error(`Missing team for fixture ${f.api_id}`);
    return dbFixtureToESPN({ ...f, home_team: ht, away_team: at } as DbFixture);
  });
}

export async function fetchHistoricalStandings(matchweek: number, season: number): Promise<ESPNStandingEntry[]> {
  const { data: snapRows, error: sErr } = await supabase
    .from("standings_snapshots")
    .select("position, played, won, drawn, lost, goals_for, goals_against, goal_diff, points, team_id")
    .eq("league", "epl")
    .eq("season", season)
    .eq("matchweek", matchweek)
    .order("position");

  if (sErr) throw new Error(`fetchHistoricalStandings: ${sErr.message}`);
  if (!snapRows || snapRows.length === 0) return [];

  const teamIds = snapRows.map((s) => s.team_id);
  const { data: teamRows, error: tErr } = await supabase
    .from("teams")
    .select("id, api_id, name, short_name, crest_url")
    .in("id", teamIds);

  if (tErr) throw new Error(`fetchHistoricalStandings teams: ${tErr.message}`);
  const teamMap = new Map((teamRows ?? []).map((t) => [t.id as number, t as DbTeam & { id: number }]));

  return snapRows.map((s) => {
    const team = teamMap.get(s.team_id as number);
    if (!team) throw new Error(`Missing team for snapshot row`);
    return dbStandingToESPN({ ...s, team } as DbStanding);
  });
}

// ── Team page queries ─────────────────────────────────────────────────────────

export async function fetchTeam(apiId: number): Promise<TeamInfo | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, api_id, name, short_name, crest_url")
    .eq("api_id", apiId)
    .eq("league", "epl")
    .single();
  if (error || !data) return null;
  return { dbId: data.id as number, apiId: data.api_id as number, name: data.name as string, shortName: data.short_name as string, crestUrl: data.crest_url as string };
}

export async function fetchTeamFixtures(dbTeamId: number, season: number): Promise<TeamFixture[]> {
  const { data: rows, error } = await supabase
    .from("fixtures")
    .select("api_id, matchweek, kickoff, status, home_score, away_score, home_team_id, away_team_id")
    .eq("league", "epl")
    .eq("season", season)
    .or(`home_team_id.eq.${dbTeamId},away_team_id.eq.${dbTeamId}`)
    .order("kickoff");

  if (error) throw new Error(`fetchTeamFixtures: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  const oppIds = [...new Set(rows.map((r) => r.home_team_id === dbTeamId ? r.away_team_id : r.home_team_id))];
  const { data: teamRows, error: tErr } = await supabase
    .from("teams")
    .select("id, api_id, name, short_name, crest_url")
    .in("id", oppIds);
  if (tErr) throw new Error(`fetchTeamFixtures teams: ${tErr.message}`);

  const oppMap = new Map((teamRows ?? []).map((t) => [
    t.id as number,
    { dbId: t.id as number, apiId: t.api_id as number, name: t.name as string, shortName: t.short_name as string, crestUrl: t.crest_url as string } as TeamInfo,
  ]));

  return rows.map((r) => {
    const isHome = r.home_team_id === dbTeamId;
    const oppId  = isHome ? r.away_team_id : r.home_team_id;
    const opp    = oppMap.get(oppId as number)!;
    return {
      apiId:     r.api_id as number,
      matchweek: r.matchweek as number,
      kickoff:   r.kickoff as string,
      status:    r.status as string,
      isHome,
      teamScore: isHome ? r.home_score as number | null : r.away_score as number | null,
      oppScore:  isHome ? r.away_score as number | null : r.home_score as number | null,
      opponent:  opp,
    };
  });
}
