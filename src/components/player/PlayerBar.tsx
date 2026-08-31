import { useState } from "react";
import { usePlayer } from "../../lib/usePlayer";
import { formatDuration } from "../../lib/podcasts";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

const RATES = [1, 1.25, 1.5, 2];

function ProgressBar({ position, duration, onSeek }: { position: number; duration: number; onSeek: (s: number) => void }) {
  const pct = duration > 0 ? (position / duration) * 100 : 0;
  return (
    <input
      className="player-bar__progress"
      type="range"
      min={0}
      max={Math.max(duration, 1)}
      value={Math.min(position, Math.max(duration, 1))}
      aria-label="Episode progress"
      aria-valuetext={`${Math.round(pct)}% played`}
      onChange={(event) => onSeek(Number(event.currentTarget.value))}
    />
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
          <Button variant="bare" className="player-bar__btn" onClick={() => skip(-15)} aria-label="Back 15 seconds">−15</Button>
          <IconButton variant="bare" className="player-bar__btn player-bar__btn--play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "▐▐" : "▶"}
          </IconButton>
          <Button variant="bare" className="player-bar__btn" onClick={() => skip(30)} aria-label="Forward 30 seconds">+30</Button>
        </div>

        {/* Time + speed */}
        <div className="player-bar__right">
          <span className="player-bar__time">
            {formatDuration(Math.floor(position))}
            {duration > 0 && ` / ${formatDuration(Math.floor(duration))}`}
          </span>
          <Button variant="bare" className="player-bar__rate" onClick={cycleRate} aria-label={`Playback speed ${rate} times`}>{rate}×</Button>
        </div>
      </div>
    </div>
  );
}
