const NFL_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const NFL_V2   = "https://site.web.api.espn.com/apis/v2/sports/football/nfl";

export const NFL_TOTAL_WEEKS = 18;

// Hardcoded division → team ID map (ESPN team IDs, confirmed from API)
export const NFL_DIVISIONS: Record<string, { conf: "AFC" | "NFC"; div: string; teamIds: string[] }> = {
  "AFC East":  { conf: "AFC", div: "East",  teamIds: ["2",  "15", "17", "20"] },
  "AFC North": { conf: "AFC", div: "North", teamIds: ["33", "4",  "5",  "23"] },
  "AFC South": { conf: "AFC", div: "South", teamIds: ["34", "11", "30", "10"] },
  "AFC West":  { conf: "AFC", div: "West",  teamIds: ["7",  "12", "13", "24"] },
  "NFC East":  { conf: "NFC", div: "East",  teamIds: ["6",  "19", "21", "28"] },
  "NFC North": { conf: "NFC", div: "North", teamIds: ["3",  "8",  "9",  "16"] },
  "NFC South": { conf: "NFC", div: "South", teamIds: ["1",  "29", "18", "27"] },
  "NFC West":  { conf: "NFC", div: "West",  teamIds: ["22", "14", "25", "26"] },
};

export const DIV_ORDER = ["East", "North", "South", "West"] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NFLGame {
  id: string;
  date: string;
  name: string;
  competitions: [{
    status: {
      displayClock: string;
      type: { state: "pre" | "in" | "post"; completed: boolean; shortDetail: string };
    };
    venue?: { fullName: string; address: { city: string; state: string } };
    competitors: Array<{
      homeAway: "home" | "away";
      winner: boolean | null;
      score: string;
      team: {
        id: string;
        displayName: string;
        shortDisplayName: string;
        abbreviation: string;
        logo: string;
        color: string;
      };
    }>;
    broadcasts?: Array<{ market: string; names: string[] }>;
  }];
}

export interface NFLStatEntry {
  name: string;
  displayValue: string;
  value: number;
  summary?: string;
}

export interface NFLStandingEntry {
  team: {
    id: string;
    displayName: string;
    shortDisplayName: string;
    abbreviation: string;
    logos: Array<{ href: string }>;
  };
  stats: NFLStatEntry[];
}

export interface NFLConference {
  id: string;
  name: string;
  shortName: "AFC" | "NFC";
  entries: NFLStandingEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getStat(entry: NFLStandingEntry, name: string): NFLStatEntry | undefined {
  return entry.stats.find((s) => s.name === name);
}

export function groupByDivision(
  entries: NFLStandingEntry[],
  confShort: "AFC" | "NFC",
): Array<{ divName: string; entries: NFLStandingEntry[] }> {
  return DIV_ORDER.map((div) => {
    const key = `${confShort} ${div}`;
    const divInfo = NFL_DIVISIONS[key];
    if (!divInfo) return { divName: key, entries: [] };
    const teamIdSet = new Set(divInfo.teamIds);
    const divEntries = entries
      .filter((e) => teamIdSet.has(e.team.id))
      .sort((a, b) => {
        const wDiff = (getStat(b, "wins")?.value ?? 0) - (getStat(a, "wins")?.value ?? 0);
        if (wDiff !== 0) return wDiff;
        return (getStat(b, "winPercent")?.value ?? 0) - (getStat(a, "winPercent")?.value ?? 0);
      });
    return { divName: key, entries: divEntries };
  });
}

export function weekDateRange(games: NFLGame[]): string {
  if (games.length === 0) return "";
  const dates = games.map((g) => new Date(g.date));
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return min.toDateString() === max.toDateString() ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function fetchNFLScoreboard(
  week?: number,
): Promise<{ week: number; season: number; games: NFLGame[]; leagueLogo: string | null }> {
  const params = week ? `?week=${week}&seasontype=2` : "";
  const res = await fetch(`${NFL_BASE}/scoreboard${params}`);
  if (!res.ok) throw new Error(`NFL scoreboard ${res.status}`);
  const data = await res.json();
  return {
    week:        data.week?.number ?? 1,
    season:      data.season?.year ?? new Date().getFullYear(),
    games:       data.events ?? [],
    leagueLogo:  data.leagues?.[0]?.logos?.[0]?.href ?? null,
  };
}

export interface NFLArticle {
  headline:    string;
  description: string;
  published:   string;
  url:         string;
  source:      string;
}

export async function fetchNFLNews(): Promise<NFLArticle[]> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nfl-news`, {
    headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`NFL news ${res.status}`);
  const data = await res.json();
  return data.articles ?? [];
}

export async function fetchNFLStandings(): Promise<NFLConference[]> {
  const res = await fetch(`${NFL_V2}/standings`);
  if (!res.ok) throw new Error(`NFL standings ${res.status}`);
  const data = await res.json();
  return ((data.children ?? []) as Record<string, unknown>[]).map((c) => ({
    id:        c.id as string,
    name:      c.name as string,
    shortName: (c.name as string).includes("American") ? "AFC" : "NFC",
    entries:   ((c as { standings: { entries: NFLStandingEntry[] } }).standings?.entries ?? []),
  }));
}
