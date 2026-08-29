export type LeagueId = "epl" | "nfl" | "nba" | "cfb";

export interface Team {
  id: number;
  league: LeagueId;
  api_id: number;
  name: string;
  short_name: string;
  crest_url: string | null;
  colors: { primary: string; secondary: string } | null;
}

export interface Fixture {
  id: number;
  league: LeagueId;
  api_id: number;
  season: number;
  round: string;
  home_team_id: number;
  away_team_id: number;
  kickoff: string;           // ISO timestamp
  status: FixtureStatus;
  home_score: number | null;
  away_score: number | null;
  home_team?: Team;
  away_team?: Team;
}

export type FixtureStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Standing {
  id: number;
  league: LeagueId;
  season: number;
  team_id: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: string | null;     // e.g. "WWDLW"
  team?: Team;
}

export interface TopScorer {
  id: number;
  league: LeagueId;
  season: number;
  player_api_id: number;
  player_name: string;
  team_id: number;
  goals: number;
  assists: number;
  appearances: number;
  team?: Team;
}

export interface NewsItem {
  id: number;
  league: LeagueId | null;  // null = cross-league
  title: string;
  url: string;
  source: string;
  summary: string | null;
  image_url: string | null;
  published_at: string;
}

export interface SyncLog {
  id: number;
  feed: string;
  synced_at: string;
  status: "ok" | "error";
  message: string | null;
}
