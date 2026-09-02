import type { ESPNFixture, ESPNStandingEntry } from "../espn";
import type { CompactGameModel, CompactGameTeamModel, CompactStandingModel } from "../../models/home";

function compactTeam(competitor: ESPNFixture["competitions"][0]["competitors"][number]): CompactGameTeamModel {
  return {
    id: competitor.team.id,
    name: competitor.team.displayName,
    shortName: competitor.team.shortDisplayName,
    abbreviation: competitor.team.abbreviation,
    crest: competitor.team.logo,
    score: competitor.score,
    winner: competitor.winner,
  };
}

export function toCompactGame(fixture: ESPNFixture, options: { leagueLabel: string; routeBase: string }): CompactGameModel {
  const competition = fixture.competitions[0];
  const home = competition.competitors.find((team) => team.homeAway === "home")!;
  const away = competition.competitors.find((team) => team.homeAway === "away")!;
  const state = competition.status.type.state === "pre" ? "scheduled"
    : competition.status.type.state === "in" ? "live" : "final";
  const statusLabel = state === "final" ? "FT" : state === "live" ? competition.status.displayClock
    : new Date(fixture.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    id: fixture.id,
    href: `${options.routeBase}/${fixture.id}`,
    accessibleLabel: `${home.team.displayName} vs ${away.team.displayName}`,
    leagueLabel: options.leagueLabel,
    state,
    statusLabel,
    wire: state === "live" && parseInt(competition.status.displayClock) >= 88,
    teams: [compactTeam(home), compactTeam(away)],
  };
}

function stat(entry: ESPNStandingEntry, name: string) {
  return entry.stats.find((item) => item.name === name)?.displayValue ?? "–";
}

export function toCompactStanding(entry: ESPNStandingEntry, index: number, routeBase: string): CompactStandingModel {
  return {
    id: entry.team.id,
    href: `${routeBase}/${entry.team.id}`,
    position: parseInt(stat(entry, "rank")) || index + 1,
    teamName: entry.team.shortDisplayName,
    goalDifference: stat(entry, "pointDifferential"),
    points: stat(entry, "points"),
  };
}
