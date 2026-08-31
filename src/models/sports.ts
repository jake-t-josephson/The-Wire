export interface TeamModel {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  crest?: string | null;
}

export interface BroadcastModel {
  name: string;
  label: string;
  logo?: string;
  url?: string;
}

export type GameState = "scheduled" | "live" | "final";

export interface GameSideModel {
  team: TeamModel;
  score?: string;
  winner?: boolean;
}

export interface GameRowModel {
  id: string;
  accessibleLabel: string;
  href?: string;
  left: GameSideModel;
  right: GameSideModel;
  state: GameState;
  statusLabel?: string;
  scheduledLabel?: string;
  eyebrow?: string;
  venue?: string | null;
  broadcasts?: BroadcastModel[];
  wire?: boolean;
}

export type StandingTone = "default" | "muted" | "positive" | "negative" | "warning";

export interface StandingCellModel {
  value: string;
  detail?: string;
  tone?: StandingTone;
  detailTone?: StandingTone;
}

export interface StandingColumnModel {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right";
  emphasis?: boolean;
}

export interface StandingRowModel {
  id: string;
  href?: string;
  rank?: number;
  movement?: number;
  team: TeamModel;
  cells: Record<string, StandingCellModel>;
  zone?: "primary" | "secondary" | "warning" | "danger";
}

export interface StandingGroupModel {
  id: string;
  label?: string;
  rows: StandingRowModel[];
}
