const CFB_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

// ESPN conference IDs
export const CFB_CONFERENCES = {
  SEC:    "8",
  Big10:  "5",
} as const;

export type CFBConferenceKey = keyof typeof CFB_CONFERENCES;

export const CFB_TOTAL_WEEKS = 15;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CFBTeam {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
}

export interface CFBGame {
  id: string;
  date: string;
  name: string;
  competitions: [{
    status: {
      displayClock: string;
      type: { state: "pre" | "in" | "post"; completed: boolean; shortDetail: string };
    };
    venue?: { fullName: string; address?: { city: string; state: string } };
    competitors: Array<{
      homeAway: "home" | "away";
      winner: boolean | null;
      score: string;
      curatedRank?: { current: number };
      team: CFBTeam;
    }>;
    broadcasts?: Array<{ market: string; names: string[] }>;
  }];
}

export interface CFBRankingEntry {
  rank: number;
  previousRank?: number;
  team: CFBTeam;
  points: number;
  firstPlaceVotes?: number;
  record?: string;
}

export interface CFBArticle {
  headline: string;
  description: string;
  published: string;
  links: { web: { href: string } };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function groupCFBByDate(games: CFBGame[]): Array<{ label: string; games: CFBGame[] }> {
  const map = new Map<string, CFBGame[]>();
  for (const g of games) {
    const label = new Date(g.date).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(g);
  }
  return Array.from(map.entries()).map(([label, games]) => ({ label, games }));
}

export function cfbWeekDateRange(games: CFBGame[]): string {
  if (games.length === 0) return "";
  const dates = games.map((g) => new Date(g.date));
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return min.toDateString() === max.toDateString() ? fmt(min) : `${fmt(min)} · ${fmt(max)}`;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function get(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CFB fetch failed: ${url}`);
  return res.json();
}

export async function fetchCFBScoreboard(
  week?: number,
  conferenceId?: string,
): Promise<{ week: number; season: number; games: CFBGame[]; leagueLogo: string | null }> {
  const params = new URLSearchParams({ seasontype: "2" });
  if (week) params.set("week", String(week));
  if (conferenceId) params.set("groups", conferenceId);
  const data = await get(`${CFB_BASE}/scoreboard?${params}`);
  const logos: Array<{ href: string; rel: string[] }> = data.leagues?.[0]?.logos ?? [];
  const darkLogo  = logos.find((l) => l.rel?.includes("dark"))?.href ?? null;
  const lightLogo = logos.find((l) => l.rel?.includes("default"))?.href ?? null;
  return {
    week:       data.week?.number ?? 1,
    season:     data.season?.year ?? new Date().getFullYear(),
    games:      data.events ?? [],
    leagueLogo: darkLogo ?? lightLogo,
  };
}

export async function fetchCFBRankings(week?: number): Promise<CFBRankingEntry[]> {
  const params = new URLSearchParams({ seasontype: "2" });
  if (week) params.set("week", String(week));
  const data = await get(`${CFB_BASE}/rankings?${params}`);
  const polls: Array<{ shortName: string; ranks: Array<{
    current: number; previous: number; points: number; firstPlaceVotes: number; recordSummary?: string;
    team: { id: string; nickname: string; abbreviation: string; color: string; logos: Array<{ href: string }> };
  }> }> = data.rankings ?? [];
  const ap = polls.find((p) => p.shortName === "AP Top 25") ?? polls[0];
  if (!ap) return [];
  return ap.ranks.map((r) => ({
    rank:            r.current,
    previousRank:    r.previous,
    points:          r.points,
    firstPlaceVotes: r.firstPlaceVotes,
    record:          r.recordSummary ?? undefined,
    team: {
      id:                r.team.id,
      displayName:       r.team.nickname,
      shortDisplayName:  r.team.nickname,
      abbreviation:      r.team.abbreviation,
      color:             r.team.color,
      logo:              r.team.logos?.[0]?.href ?? "",
    },
  }));
}

export async function fetchCFBNews(): Promise<CFBArticle[]> {
  const data = await get(`${CFB_BASE}/news`);
  return data.articles ?? [];
}

// ── Supabase (poll snapshots) ─────────────────────────────────────────────────

import { supabase } from "./supabase";

export async function fetchCFBPollSnapshot(season: number, week: number): Promise<CFBRankingEntry[]> {
  const { data, error } = await supabase
    .from("cfb_poll_snapshots")
    .select("rank, previous_rank, team_espn_id, team_name, team_abbr, team_logo, record, points")
    .eq("season", season)
    .eq("week", week)
    .order("rank");
  if (error) throw new Error(`fetchCFBPollSnapshot: ${error.message}`);
  return (data ?? []).map((r) => ({
    rank:         r.rank,
    previousRank: r.previous_rank ?? undefined,
    record:       r.record ?? undefined,
    points:       r.points ?? 0,
    team: {
      id:               r.team_espn_id,
      displayName:      r.team_name,
      shortDisplayName: r.team_name,
      abbreviation:     r.team_abbr,
      color:            "",
      logo:             r.team_logo ?? "",
    },
  }));
}
