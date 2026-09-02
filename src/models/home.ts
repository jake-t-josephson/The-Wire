import type { GameState, TeamModel } from "./sports";

export interface CompactGameTeamModel extends TeamModel {
  score?: string;
  winner?: boolean;
}

export interface CompactGameModel {
  id: string;
  href: string;
  accessibleLabel: string;
  leagueLabel: string;
  state: GameState;
  statusLabel: string;
  wire?: boolean;
  teams: [CompactGameTeamModel, CompactGameTeamModel];
}

export interface CompactStandingModel {
  id: string;
  href: string;
  position: number;
  teamName: string;
  goalDifference: string;
  points: string;
}
