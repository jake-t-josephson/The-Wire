import type { CFBGame } from "../cfb";
import type { GameRowModel, TeamModel } from "../../models/sports";
import { toBroadcast } from "./shared";

function toTeam(
  team: CFBGame["competitions"][0]["competitors"][number]["team"],
  rank?: number,
): TeamModel {
  return {
    id: team.id,
    name: team.displayName,
    shortName: rank && rank <= 25 ? `#${rank} ${team.abbreviation}` : team.abbreviation,
    abbreviation: team.abbreviation,
    crest: team.logo,
  };
}

export function toCFBGameRow(game: CFBGame): GameRowModel {
  const competition = game.competitions[0];
  const home = competition.competitors.find((c) => c.homeAway === "home")!;
  const away = competition.competitors.find((c) => c.homeAway === "away")!;
  const state = competition.status.type.state === "pre" ? "scheduled"
    : competition.status.type.state === "in" ? "live" : "final";
  const period = competition.status.type.shortDetail.split(" ").slice(-1)[0];

  const awayRank = away.curatedRank?.current;
  const homeRank = home.curatedRank?.current;

  return {
    id: game.id,
    accessibleLabel: `${away.team.displayName} at ${home.team.displayName}`,
    left:  { team: toTeam(away.team, awayRank), score: away.score, winner: away.winner === true },
    right: { team: toTeam(home.team, homeRank), score: home.score, winner: home.winner === true },
    state,
    eyebrow: `${away.team.abbreviation} @ ${home.team.abbreviation}`,
    scheduledLabel: new Date(game.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }),
    statusLabel: state === "live" ? `${competition.status.displayClock} ${period}` : "FINAL",
    venue: competition.venue?.address ? `${competition.venue.address.city}, ${competition.venue.address.state}` : null,
    broadcasts: (competition.broadcasts?.[0]?.names ?? []).map(toBroadcast),
  };
}
