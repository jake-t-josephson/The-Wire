const SPORT_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const WEB_BASE   = "https://site.web.api.espn.com/apis/v2/sports";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Matchweek {
  number: number;
  label: string;
  dates: string[];
  start: string;
  end: string;
}

export interface ESPNTeam {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  color: string;
  alternateColor: string;
  logo: string;
}

export interface ESPNCompetitor {
  homeAway: "home" | "away";
  winner: boolean;
  score: string;
  team: ESPNTeam;
}

export interface ESPNFixture {
  id: string;
  date: string;
  season: { year: number };
  competitions: [{
    status: { type: { state: "pre" | "in" | "post"; shortDetail: string } };
    venue?: { fullName: string };
    competitors: ESPNCompetitor[];
  }];
}

export interface ESPNStandingEntry {
  team: {
    id: string;
    displayName: string;
    shortDisplayName: string;
    abbreviation: string;
    logos: Array<{ href: string }>;
  };
  stats: Array<{ name: string; displayValue: string; value: number }>;
}

export interface ESPNTeamMatchStats {
  team: { id: string };
  homeAway: "home" | "away";
  statistics: Array<{ name: string; displayValue: string; value?: number }>;
}

export interface ESPNArticle {
  headline: string;
  description: string;
  published: string;
  links: { web: { href: string } };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function get(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${url}`);
  return res.json();
}

export function groupMatchweeks(calendarDates: string[]): Matchweek[] {
  if (calendarDates.length === 0) return [];
  const dates = [...calendarDates].map((d) => d.slice(0, 10)).sort();
  const weeks: Matchweek[] = [];
  let current = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const gap = (new Date(dates[i]).getTime() - new Date(current[current.length - 1]).getTime()) / 86_400_000;
    if (gap <= 2) { current.push(dates[i]); }
    else { weeks.push(build(weeks.length + 1, current)); current = [dates[i]]; }
  }
  weeks.push(build(weeks.length + 1, current));
  return weeks;
}

function build(n: number, dates: string[]): Matchweek {
  return { number: n, label: `GW${n}`, dates, start: dates[0].replace(/-/g, ""), end: dates[dates.length - 1].replace(/-/g, "") };
}

export function currentMatchweekIndex(matchweeks: Matchweek[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const idx = matchweeks.findIndex((mw) => mw.dates[mw.dates.length - 1] >= today);
  return idx === -1 ? matchweeks.length - 1 : idx;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export interface ESPNLeagueInfo {
  id: string;
  name: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
}

export async function fetchCalendar(): Promise<{ calendar: string[]; season: number; league: ESPNLeagueInfo }> {
  const data = await get(`${SPORT_BASE}/soccer/eng.1/scoreboard`);
  const l = data.leagues?.[0] ?? {};
  const logos: Array<{ href: string; rel: string[] }> = l.logos ?? [];
  return {
    calendar:    l.calendar ?? [],
    season:      data.season?.year ?? new Date().getFullYear(),
    league: {
      id:          l.id ?? "700",
      name:        l.name ?? "English Premier League",
      logoUrl:     logos.find((x) => x.rel?.includes("default"))?.href ?? null,
      darkLogoUrl: logos.find((x) => x.rel?.includes("dark"))?.href ?? null,
    },
  };
}

export async function fetchMatchweekFixtures(dates: string[]): Promise<ESPNFixture[]> {
  const seen = new Set<string>();
  const fixtures: ESPNFixture[] = [];
  for (const date of dates) {
    const d = await get(`${SPORT_BASE}/soccer/eng.1/scoreboard?dates=${date}`);
    for (const event of (d.events ?? [])) {
      if (!seen.has(event.id)) { seen.add(event.id); fixtures.push(event); }
    }
  }
  return fixtures;
}

export async function fetchMatchSummary(eventId: string): Promise<ESPNTeamMatchStats[]> {
  const data = await get(`${SPORT_BASE}/soccer/eng.1/summary?event=${eventId}`);
  return data.boxscore?.teams ?? [];
}

export async function fetchStandings(): Promise<ESPNStandingEntry[]> {
  const data = await get(`${WEB_BASE}/soccer/eng.1/standings`);
  return data.children?.[0]?.standings?.entries ?? [];
}

export async function fetchNews(): Promise<ESPNArticle[]> {
  const data = await get(`${SPORT_BASE}/soccer/eng.1/news`);
  return data.articles ?? [];
}

// ── NFL ───────────────────────────────────────────────────────────────────────

const NFL_BASE = `${SPORT_BASE}/football/nfl`;

export interface NFLTeam {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
}

export interface NFLGame {
  id: string;
  date: string;
  competitions: [{
    status: { type: { state: "pre" | "in" | "post"; completed: boolean; shortDetail: string } };
    venue?: { fullName: string; address?: { city: string; state: string } };
    competitors: Array<{ homeAway: "home" | "away"; winner: boolean | null; score: string; team: NFLTeam }>;
  }];
}

export async function fetchNFLScoreboard(
  week?: number,
): Promise<{ week: number; season: number; games: NFLGame[]; leagueLogo: string | null }> {
  const params = week ? `?week=${week}&seasontype=2` : "";
  const data = await get(`${NFL_BASE}/scoreboard${params}`);
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

export async function fetchNFLNews(): Promise<ESPNArticle[]> {
  const data = await get(`${NFL_BASE}/news`);
  return data.articles ?? [];
}

// ── CFB ───────────────────────────────────────────────────────────────────────

const CFB_BASE = `${SPORT_BASE}/football/college-football`;

export interface CFBRankingEntry {
  rank: number;
  previous?: number;
  points?: number;
  recordSummary?: string;
  team: {
    id: string;
    nickname: string;
    abbreviation: string;
    color: string;
    logos: Array<{ href: string }>;
  };
}

export async function fetchCFBCurrentPoll(): Promise<{ season: number; week: number; rankings: CFBRankingEntry[] }> {
  const data = await get(`${CFB_BASE}/rankings?seasontype=2`);
  const ap = (data.rankings ?? []).find((p: { shortName: string }) => p.shortName === "AP Top 25")
    ?? data.rankings?.[0];
  const week = parseInt(data.latestWeek?.number ?? data.weeks?.slice(-1)[0]?.week ?? "1");
  const season = data.latestSeason?.year ?? new Date().getFullYear();
  return {
    season,
    week,
    rankings: (ap?.ranks ?? []) as CFBRankingEntry[],
  };
}

export async function fetchCFBNews(): Promise<ESPNArticle[]> {
  const data = await get(`${CFB_BASE}/news`);
  return data.articles ?? [];
}
