import { useState, useEffect } from "react";
import {
  fetchFeeds, fetchEpisodes, fetchProgress,
  formatDuration, formatPubDate,
  type PodcastFeed, type PodcastEpisode, type PodcastProgress,
} from "../lib/podcasts";
import { usePlayer } from "../lib/playerContext";
import { Skeleton } from "../components/ui/Skeleton";

// ── Feed selector ─────────────────────────────────────────────────────────────

function FeedCard({
  feed,
  selected,
  onClick,
}: {
  feed: PodcastFeed;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`podcast-feed-card${selected ? " podcast-feed-card--active" : ""}`}
      onClick={onClick}
    >
      {feed.artwork_url ? (
        <img src={feed.artwork_url} alt={feed.title ?? ""} className="podcast-feed-card__art" />
      ) : (
        <div className="podcast-feed-card__art podcast-feed-card__art--placeholder" />
      )}
      <span className="podcast-feed-card__title">{feed.title ?? "Loading…"}</span>
      <div className="podcast-feed-card__leagues">
        {feed.leagues.map((l) => (
          <span key={l} className="podcast-feed-card__league">{l.toUpperCase()}</span>
        ))}
      </div>
    </button>
  );
}

// ── Episode row ───────────────────────────────────────────────────────────────

function EpisodeRow({
  episode,
  progress,
  active,
  onPlay,
}: {
  episode:  PodcastEpisode;
  progress: PodcastProgress | undefined;
  active:   boolean;
  onPlay:   () => void;
}) {
  const pct = progress && episode.duration_seconds
    ? Math.min(100, (progress.position_seconds / episode.duration_seconds) * 100)
    : 0;

  return (
    <div className={`episode-row${active ? " episode-row--active" : ""}`} onClick={onPlay}>
      <div className="episode-row__main">
        <div className="episode-row__title">{episode.title}</div>
        <div className="episode-row__meta">
          {formatPubDate(episode.pub_date)}
          {episode.duration_seconds ? ` · ${formatDuration(episode.duration_seconds)}` : ""}
          {progress?.completed && <span className="episode-row__badge">✓</span>}
        </div>
        {pct > 0 && !progress?.completed && (
          <div className="episode-row__progress">
            <div className="episode-row__progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <button className="episode-row__play" aria-label={active ? "Playing" : "Play"}>
        {active ? "▐▐" : "▶"}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Podcasts() {
  const [feeds,         setFeeds]         = useState<PodcastFeed[]>([]);
  const [selectedFeed,  setSelectedFeed]  = useState<PodcastFeed | null>(null);
  const [episodes,      setEpisodes]      = useState<PodcastEpisode[]>([]);
  const [progressMap,   setProgressMap]   = useState<Map<string, PodcastProgress>>(new Map());
  const [loadingFeeds,  setLoadingFeeds]  = useState(true);
  const [loadingEps,    setLoadingEps]    = useState(false);

  const { episode: currentEpisode, load } = usePlayer();

  useEffect(() => {
    fetchFeeds()
      .then((f) => { setFeeds(f); if (f.length > 0) setSelectedFeed(f[0]); })
      .finally(() => setLoadingFeeds(false));
  }, []);

  useEffect(() => {
    if (!selectedFeed) return;
    setLoadingEps(true);
    fetchEpisodes(selectedFeed.id)
      .then(async (eps) => {
        setEpisodes(eps);
        const prog = await fetchProgress(eps.map((e) => e.guid));
        setProgressMap(prog);
      })
      .finally(() => setLoadingEps(false));
  }, [selectedFeed]);

  const handlePlay = (episode: PodcastEpisode) => {
    if (!selectedFeed) return;
    const prog = progressMap.get(episode.guid);
    load(episode, selectedFeed, prog?.position_seconds ?? 0);
  };

  return (
    <div className="podcasts-page">
      <div className="podcasts-page__header">
        <div className="podcasts-page__eyebrow">
          The Wire · {selectedFeed?.leagues.length ? selectedFeed.leagues.map(l => l.toUpperCase()).join(" / ") : "Podcasts"}
        </div>
        <div className="podcasts-page__title">Podcasts</div>
      </div>

      {/* Feed selector */}
      <div className="podcast-feed-list">
        {loadingFeeds
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} />)
          : feeds.map((f) => (
            <FeedCard
              key={f.id}
              feed={f}
              selected={selectedFeed?.id === f.id}
              onClick={() => setSelectedFeed(f)}
            />
          ))
        }
      </div>

      {/* Episode list */}
      <div className="episode-list">
        {loadingEps
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} />)
          : episodes.length === 0
          ? <p className="episode-list__empty">No episodes yet — feeds refresh hourly.</p>
          : episodes.map((ep) => (
            <EpisodeRow
              key={ep.guid}
              episode={ep}
              progress={progressMap.get(ep.guid)}
              active={currentEpisode?.guid === ep.guid}
              onPlay={() => handlePlay(ep)}
            />
          ))
        }
      </div>
    </div>
  );
}
