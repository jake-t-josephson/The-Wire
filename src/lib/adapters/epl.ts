import type { ESPNFixture } from "../espn";
import type { GameRowModel, TeamModel } from "../../models/sports";
import { toBroadcast } from "./shared";

function toTeam(team: ESPNFixture["competitions"][0]["competitors"][number]["team"]): TeamModel {
  return {
    id: team.id,
    name: team.displayName,
    shortName: team.shortDisplayName,
    abbreviation: team.abbreviation,
    crest: team.logo,
  };
}

export function toEPLGameRow(fixture: ESPNFixture): GameRowModel {
  const competition = fixture.competitions[0];
  const home = competition.competitors.find((team) => team.homeAway === "home")!;
  const away = competition.competitors.find((team) => team.homeAway === "away")!;
  const state = competition.status.type.state === "pre" ? "scheduled"
    : competition.status.type.state === "in" ? "live" : "final";

  return {
    id: fixture.id,
    href: `/epl/match/${fixture.id}`,
    accessibleLabel: `${home.team.displayName} vs ${away.team.displayName}`,
    left: { team: toTeam(home.team), score: home.score, winner: home.winner },
    right: { team: toTeam(away.team), score: away.score, winner: away.winner },
    state,
    scheduledLabel: new Date(fixture.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    statusLabel: state === "live" ? competition.status.displayClock : "FT",
    wire: state === "live" && parseInt(competition.status.displayClock) >= 88,
    venue: competition.venue?.fullName,
    broadcasts: (competition.broadcasts?.[0]?.names ?? []).map(toBroadcast),
  };
}
