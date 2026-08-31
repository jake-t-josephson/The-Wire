import { useState } from "react";
import { usePlayer } from "../../lib/playerContext";
import { formatDuration } from "../../lib/podcasts";

const RATES = [1, 1.25, 1.5, 2];

function ProgressBar({ position, duration, onSeek }: { position: number; duration: number; onSeek: (s: number) => void }) {
  const pct = duration > 0 ? (position / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  return (
    <div className="player-bar__progress" onClick={handleClick}>
      <div className="player-bar__progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PlayerBar() {
  const { episode, feed, playing, position, duration, toggle, seek, skip, setRate } = usePlayer();
  const [rate, setRateLocal] = useState(1);

  if (!episode) return null;

  const artwork = episode.artwork_url ?? feed?.artwork_url ?? null;

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRateLocal(next);
    setRate(next);
  };

  return (
    <div className="player-bar">
      <ProgressBar position={position} duration={duration} onSeek={seek} />

      <div className="player-bar__body">
        {/* Artwork + episode info */}
        <div className="player-bar__info">
          {artwork ? (
            <img src={artwork} alt="" className="player-bar__art" />
          ) : (
            <div className="player-bar__art player-bar__art--placeholder" />
          )}
          <div className="player-bar__text">
            <div className="player-bar__ep-title">{episode.title}</div>
            <div className="player-bar__feed-title">{feed?.title ?? ""}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="player-bar__controls">
          <button className="player-bar__btn" onClick={() => skip(-15)} aria-label="Back 15s">−15</button>
          <button className="player-bar__btn player-bar__btn--play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "▐▐" : "▶"}
          </button>
          <button className="player-bar__btn" onClick={() => skip(30)} aria-label="Forward 30s">+30</button>
        </div>

        {/* Time + speed */}
        <div className="player-bar__right">
          <span className="player-bar__time">
            {formatDuration(Math.floor(position))}
            {duration > 0 && ` / ${formatDuration(Math.floor(duration))}`}
          </span>
          <button className="player-bar__rate" onClick={cycleRate}>{rate}×</button>
        </div>
      </div>
    </div>
  );
}
