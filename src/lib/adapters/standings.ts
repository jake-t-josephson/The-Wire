import type { ESPNStandingEntry, MatchweekStats } from "../espn";
import { groupByDivision, getStat as getNFLStat, type NFLConference, type NFLStandingEntry } from "../nfl";
import type { StandingColumnModel, StandingGroupModel, StandingRowModel, TeamModel } from "../../models/sports";

export const EPL_STANDING_COLUMNS: StandingColumnModel[] = [
  { key: "mp", label: "MP", width: "1.625rem", align: "right" },
  { key: "w", label: "W", width: "1.625rem", align: "right" },
  { key: "d", label: "D", width: "1.625rem", align: "right" },
  { key: "l", label: "L", width: "1.625rem", align: "right" },
  { key: "gd", label: "GD", width: "2.125rem", align: "right" },
  { key: "pts", label: "Pts", width: "2.125rem", align: "right", emphasis: true },
];

export const NFL_STANDING_COLUMNS: StandingColumnModel[] = [
  { key: "record", label: "W-L", width: "3.25rem" },
  { key: "pct", label: "PCT", width: "2.25rem", align: "right" },
  { key: "pf", label: "PF", width: "2.25rem", align: "right" },
  { key: "streak", label: "STK", width: "2.25rem", align: "right" },
];

function teamModel(team: ESPNStandingEntry["team"] | NFLStandingEntry["team"]): TeamModel {
  return {
    id: team.id,
    name: team.displayName,
    shortName: team.shortDisplayName,
    abbreviation: team.abbreviation || team.shortDisplayName.slice(0, 3),
    crest: team.logos?.[0]?.href,
  };
}

function eplStat(entry: ESPNStandingEntry, name: string) {
  return entry.stats.find((stat) => stat.name === name)?.displayValue ?? "–";
}

function eplZone(rank: number): StandingRowModel["zone"] {
  if (rank >= 1 && rank <= 4) return "primary";
  if (rank <= 6) return "secondary";
  if (rank === 7) return "warning";
  if (rank >= 18) return "danger";
  return undefined;
}

export function toEPLStandings(
  entries: ESPNStandingEntry[],
  matchweekStats: Map<string, MatchweekStats>,
  positionChanges: Map<string, number>,
): StandingGroupModel[] {
  return [{
    id: "premier-league",
    rows: entries.map((entry, index) => {
      const matchweek = matchweekStats.get(entry.team.id);
      const gdDetail = matchweek?.gd ? (matchweek.gd > 0 ? `+${matchweek.gd}` : `${matchweek.gd}`) : undefined;
      const pointsDetail = matchweek?.pts ? `+${matchweek.pts}` : undefined;
      const rank = parseInt(eplStat(entry, "rank")) || index + 1;
      return {
        id: entry.team.id,
        href: `/epl/team/${entry.team.id}`,
        rank,
        movement: positionChanges.get(entry.team.id),
        team: teamModel(entry.team),
        zone: eplZone(rank),
        cells: {
          mp: { value: eplStat(entry, "gamesPlayed"), tone: "muted" },
          w: { value: eplStat(entry, "wins"), tone: "muted" },
          d: { value: eplStat(entry, "ties"), tone: "muted" },
          l: { value: eplStat(entry, "losses"), tone: "muted" },
          gd: { value: eplStat(entry, "pointDifferential"), detail: gdDetail, detailTone: matchweek && matchweek.gd > 0 ? "positive" : "negative" },
          pts: { value: eplStat(entry, "points"), detail: pointsDetail, detailTone: matchweek?.pts === 3 ? "positive" : "warning" },
        },
      };
    }),
  }];
}

function toNFLRow(entry: NFLStandingEntry, rank?: number): StandingRowModel {
  const wins = getNFLStat(entry, "wins")?.displayValue ?? "–";
  const losses = getNFLStat(entry, "losses")?.displayValue ?? "–";
  const ties = getNFLStat(entry, "ties")?.value ?? 0;
  const streak = getNFLStat(entry, "streak")?.displayValue ?? "–";
  return {
    id: entry.team.id,
    rank,
    team: teamModel(entry.team),
    cells: {
      record: { value: `${wins}-${losses}${ties > 0 ? `-${ties}` : ""}` },
      pct: { value: getNFLStat(entry, "winPercent")?.displayValue ?? "–", tone: "muted" },
      pf: { value: getNFLStat(entry, "pointsFor")?.displayValue ?? "–", tone: "muted" },
      streak: { value: streak, tone: streak.startsWith("W") ? "positive" : "negative" },
    },
  };
}

export function toNFLDivisionStandings(conference: NFLConference): StandingGroupModel[] {
  return groupByDivision(conference.entries, conference.shortName).map(({ divName, entries }) => ({
    id: divName,
    label: divName,
    rows: entries.map((entry) => toNFLRow(entry)),
  }));
}

export function toNFLConferenceStandings(conference: NFLConference): StandingGroupModel[] {
  const entries = [...conference.entries].sort(
    (a, b) => (getNFLStat(a, "playoffSeed")?.value ?? 99) - (getNFLStat(b, "playoffSeed")?.value ?? 99),
  );
  return [{ id: conference.shortName, rows: entries.map((entry, index) => toNFLRow(entry, index + 1)) }];
}
