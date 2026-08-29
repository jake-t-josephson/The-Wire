const SPORT_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const WEB_BASE   = "https://site.web.api.espn.com/apis/v2/sports";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Matchweek {
  number: number;
  label: string;
  dates: string[];  // YYYY-MM-DD
  start: string;    // YYYYMMDD (for API)
  end: string;      // YYYYMMDD (for API)
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
  form?: string;
  team: ESPNTeam;
}

export type FixtureState = "pre" | "in" | "post";

export interface ESPNFixture {
  id: string;
  date: string;
  name: string;
  competitions: [{
    status: {
      displayClock: string;
      type: {
        state: FixtureState;
        completed: boolean;
        shortDetail: string;
      };
    };
    venue?: { fullName: string; address: { city: string } };
    competitors: ESPNCompetitor[];
    broadcasts?: Array<{ market: string; names: string[] }>;
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
  note?: { color: string; description: string };
  stats: Array<{ name: string; displayValue: string; value: number }>;
}

export interface ESPNArticle {
  headline: string;
  description: string;
  published: string;
  images?: Array<{ url: string }>;
  links: { web: { href: string } };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60)    return "just now";
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Group calendar dates into matchweeks.
// Dates within 2 days of each other belong to the same matchweek;
// a gap > 2 days (midweek break, intl break) starts a new one.
export function groupMatchweeks(calendarDates: string[]): Matchweek[] {
  if (calendarDates.length === 0) return [];

  const dates = [...calendarDates].map((d) => d.slice(0, 10)).sort();
  const weeks: Matchweek[] = [];
  let current: string[] = [dates[0]];

  for (let i = 1; i < dates.length; i++) {
    const gap =
      (new Date(dates[i]).getTime() - new Date(current[current.length - 1]).getTime()) /
      86_400_000;
    if (gap <= 2) {
      current.push(dates[i]);
    } else {
      weeks.push(buildMatchweek(weeks.length + 1, current));
      current = [dates[i]];
    }
  }
  weeks.push(buildMatchweek(weeks.length + 1, current));
  return weeks;
}

function buildMatchweek(number: number, dates: string[]): Matchweek {
  return {
    number,
    label: `GW${number}`,
    dates,
    start: dates[0].replace(/-/g, ""),
    end: dates[dates.length - 1].replace(/-/g, ""),
  };
}

// Returns the 0-based index of the current or next upcoming matchweek.
export function currentMatchweekIndex(matchweeks: Matchweek[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const idx = matchweeks.findIndex((mw) => mw.dates[mw.dates.length - 1] >= today);
  return idx === -1 ? matchweeks.length - 1 : idx;
}

export interface MatchweekStats {
  pts: number;
  gd: number;
  gf: number;
}

// Points, GD, and GF earned by each team for a set of finished fixtures.
export function computeMatchweekStats(fixtures: ESPNFixture[]): Map<string, MatchweekStats> {
  const map = new Map<string, MatchweekStats>();
  const init = (id: string) => {
    if (!map.has(id)) map.set(id, { pts: 0, gd: 0, gf: 0 });
    return map.get(id)!;
  };
  for (const f of fixtures) {
    const comp = f.competitions[0];
    if (comp.status.type.state !== "post") continue;
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;
    const hs = parseInt(home.score), as_ = parseInt(away.score);
    const h = init(home.team.id);
    const a = init(away.team.id);
    h.gf += hs; h.gd += hs - as_;
    a.gf += as_; a.gd += as_ - hs;
    if (hs > as_)       { h.pts += 3; }
    else if (as_ > hs)  { a.pts += 3; }
    else                { h.pts += 1; a.pts += 1; }
  }
  return map;
}

// Back-calculates pre-matchweek positions and returns change per team.
// Positive = moved up, negative = moved down.
export function computePositionChanges(
  entries: ESPNStandingEntry[],
  mwStats: Map<string, MatchweekStats>
): Map<string, number> {
  const val = (e: ESPNStandingEntry, name: string) =>
    e.stats.find((s) => s.name === name)?.value ?? 0;

  const curPos = new Map<string, number>();
  entries.forEach((e, i) => curPos.set(e.team.id, i + 1));

  const pre = entries.map((e) => {
    const mw = mwStats.get(e.team.id) ?? { pts: 0, gd: 0, gf: 0 };
    return {
      id:  e.team.id,
      pts: val(e, "points")           - mw.pts,
      gd:  val(e, "pointDifferential")- mw.gd,
      gf:  val(e, "pointsFor")        - mw.gf,
    };
  });

  const sorted = [...pre].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const prePos = new Map<string, number>();
  sorted.forEach((s, i) => prePos.set(s.id, i + 1));

  const changes = new Map<string, number>();
  for (const e of entries) {
    const change = (prePos.get(e.team.id) ?? 0) - (curPos.get(e.team.id) ?? 0);
    if (change !== 0) changes.set(e.team.id, change);
  }
  return changes;
}

// Group fixtures by day label for display.
export function groupByDate(
  fixtures: ESPNFixture[]
): Array<{ label: string; fixtures: ESPNFixture[] }> {
  const map = new Map<string, ESPNFixture[]>();
  for (const f of fixtures) {
    const label = new Date(f.date).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(f);
  }
  return Array.from(map.entries()).map(([label, fixtures]) => ({ label, fixtures }));
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function get(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN fetch failed: ${url}`);
  return res.json();
}

// Pass a single date (YYYYMMDD) or a range (YYYYMMDD-YYYYMMDD).
export async function fetchFixtures(
  dates?: string
): Promise<{ fixtures: ESPNFixture[]; calendar: string[] }> {
  const params = dates ? `?dates=${dates}` : "";
  const data = await get(`${SPORT_BASE}/soccer/eng.1/scoreboard${params}`);
  return {
    fixtures: data.events ?? [],
    calendar: data.leagues?.[0]?.calendar ?? [],
  };
}

export async function fetchStandings(): Promise<ESPNStandingEntry[]> {
  const data = await get(`${WEB_BASE}/soccer/eng.1/standings`);
  return data.children?.[0]?.standings?.entries ?? [];
}

export async function fetchNews(): Promise<ESPNArticle[]> {
  const data = await get(`${SPORT_BASE}/soccer/eng.1/news`);
  return data.articles ?? [];
}
