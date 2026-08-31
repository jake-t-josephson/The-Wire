import { Link } from "react-router-dom";
import type { GameRowModel, GameSideModel } from "../../models/sports";
import { BroadcastBadge } from "./BroadcastBadge";
import { StatusDot } from "./StatusDot";
import { TeamCrest } from "./TeamCrest";

function GameSide({ side, position, final }: { side: GameSideModel; position: "left" | "right"; final: boolean }) {
  const muted = final && !side.winner;
  return (
    <div className={`game-row__team game-row__team--${position}${muted ? " game-row__team--muted" : ""}`}>
      {position === "right" && (
        <TeamCrest src={side.team.crest} name={side.team.name} abbreviation={side.team.abbreviation} />
      )}
      <span className="game-row__team-name">{side.team.shortName}</span>
      {position === "left" && (
        <TeamCrest src={side.team.crest} name={side.team.name} abbreviation={side.team.abbreviation} />
      )}
    </div>
  );
}

export function GameRow({ game }: { game: GameRowModel }) {
  const final = game.state === "final";
  const live = game.state === "live";
  return (
    <article className="game-row" data-state={game.state} aria-label={game.accessibleLabel}>
      {game.href && <Link className="game-row__link" to={game.href} aria-label={game.accessibleLabel} />}
      <GameSide side={game.left} position="left" final={final} />
      <div className="game-row__center">
        {game.eyebrow && <span className="game-row__eyebrow">{game.eyebrow}</span>}
        {game.state === "scheduled" ? (
          <>
            <time className="game-row__kickoff">{game.scheduledLabel}</time>
            {!!game.broadcasts?.length && (
              <div className="game-row__broadcasts">
                {game.broadcasts.map((broadcast) => <BroadcastBadge key={broadcast.name} broadcast={broadcast} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="game-row__score">
              <span className={final && !game.left.winner ? "game-row__score--muted" : ""}>{game.left.score}</span>
              <span className="game-row__dash">–</span>
              <span className={final && !game.right.winner ? "game-row__score--muted" : ""}>{game.right.score}</span>
            </div>
            <div className={`game-row__status${live ? " game-row__status--live" : ""}`}>
              <StatusDot state={live ? (game.wire ? "wire" : "live") : "final"} />
              <span>{game.statusLabel}</span>
            </div>
          </>
        )}
        {game.venue && <span className="game-row__venue">{game.venue}</span>}
      </div>
      <GameSide side={game.right} position="right" final={final} />
    </article>
  );
}
