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

export async function fetchCalendar(): Promise<{ calendar: string[]; season: number }> {
  const data = await get(`${SPORT_BASE}/soccer/eng.1/scoreboard`);
  return {
    calendar: data.leagues?.[0]?.calendar ?? [],
    season: data.season?.year ?? new Date().getFullYear(),
  };
}

export async function fetchMatchweekFixtures(start: string, end: string): Promise<ESPNFixture[]> {
  const param = start === end ? start : `${start}-${end}`;
  const data  = await get(`${SPORT_BASE}/soccer/eng.1/scoreboard?dates=${param}`);
  return data.events ?? [];
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
