import type { NFLGame } from "../nfl";
import type { GameRowModel, TeamModel } from "../../models/sports";
import { toBroadcast } from "./shared";

function toTeam(team: NFLGame["competitions"][0]["competitors"][number]["team"]): TeamModel {
  return {
    id: team.id,
    name: team.displayName,
    shortName: team.abbreviation,
    abbreviation: team.abbreviation,
    crest: team.logo,
  };
}

export function toNFLGameRow(game: NFLGame): GameRowModel {
  const competition = game.competitions[0];
  const home = competition.competitors.find((team) => team.homeAway === "home")!;
  const away = competition.competitors.find((team) => team.homeAway === "away")!;
  const state = competition.status.type.state === "pre" ? "scheduled"
    : competition.status.type.state === "in" ? "live" : "final";
  const period = competition.status.type.shortDetail.split(" ").slice(-1)[0];

  return {
    id: game.id,
    accessibleLabel: `${away.team.displayName} at ${home.team.displayName}`,
    left: { team: toTeam(away.team), score: away.score, winner: away.winner === true },
    right: { team: toTeam(home.team), score: home.score, winner: home.winner === true },
    state,
    eyebrow: `${away.team.abbreviation} @ ${home.team.abbreviation}`,
    scheduledLabel: new Date(game.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }),
    statusLabel: state === "live" ? `${competition.status.displayClock} ${period}` : "FINAL",
    venue: competition.venue ? `${competition.venue.address.city}, ${competition.venue.address.state}` : null,
    broadcasts: (competition.broadcasts?.[0]?.names ?? []).map(toBroadcast),
  };
}
