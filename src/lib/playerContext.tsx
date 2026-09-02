import { useRef, useState, useCallback, type ReactNode } from "react";
import type { PodcastEpisode, PodcastFeed } from "./podcasts";
import { upsertProgress } from "./podcasts";
import { PlayerContext } from "./playerContextValue";

interface PlayerState {
  episode:  PodcastEpisode | null;
  feed:     PodcastFeed | null;
  playing:  boolean;
  position: number;   // seconds — live, updated frequently
  duration: number;   // seconds
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const flushRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const guidRef   = useRef<string | null>(null);

  const [state, setState] = useState<PlayerState>({
    episode: null, feed: null, playing: false, position: 0, duration: 0,
  });

  const flushProgress = useCallback((audio: HTMLAudioElement, guid: string) => {
    const completed = audio.duration > 0 && audio.currentTime >= audio.duration - 5;
    void upsertProgress(guid, audio.currentTime, completed).catch(() => {
      // Playback remains local when cloud progress cannot be persisted.
    });
  }, []);

  const startFlushInterval = useCallback((audio: HTMLAudioElement, guid: string) => {
    if (flushRef.current) clearInterval(flushRef.current);
    flushRef.current = setInterval(() => flushProgress(audio, guid), 8000);
  }, [flushProgress]);

  const stopFlushInterval = useCallback(() => {
    if (flushRef.current) { clearInterval(flushRef.current); flushRef.current = null; }
  }, []);

  const load = useCallback((episode: PodcastEpisode, feed: PodcastFeed, resumeAt = 0) => {
    const audio = audioRef.current;
    if (!audio) return;

    stopFlushInterval();

    guidRef.current = episode.guid;
    audio.src       = episode.enclosure_url;
    audio.load();

    audio.onloadedmetadata = () => {
      if (resumeAt > 0) audio.currentTime = resumeAt;
      setState((s) => ({ ...s, duration: audio.duration, position: audio.currentTime }));
      audio.play().catch(() => {/* autoplay blocked */});
    };

    audio.ontimeupdate = () => {
      setState((s) => ({ ...s, position: audio.currentTime }));
    };

    audio.onplay = () => {
      setState((s) => ({ ...s, playing: true }));
      startFlushInterval(audio, episode.guid);
    };

    audio.onpause = () => {
      setState((s) => ({ ...s, playing: false }));
      stopFlushInterval();
      if (guidRef.current) flushProgress(audio, guidRef.current);
    };

    audio.onended = () => {
      setState((s) => ({ ...s, playing: false, position: 0 }));
      stopFlushInterval();
      if (guidRef.current) {
        void upsertProgress(guidRef.current, 0, true).catch(() => {
          // Playback remains local when cloud progress cannot be persisted.
        });
      }
    };

    setState((s) => ({ ...s, episode, feed, playing: false, position: resumeAt, duration: 0 }));
  }, [flushProgress, startFlushInterval, stopFlushInterval]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || Infinity));
  }, []);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + delta, audio.duration || Infinity));
  }, []);

  const setRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, load, toggle, seek, skip, setRate, audioRef }}>
      {children}
      <audio ref={audioRef} preload="metadata" className="visually-hidden" />
    </PlayerContext.Provider>
  );
}
