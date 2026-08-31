import { createContext, type RefObject } from "react";
import type { PodcastEpisode, PodcastFeed } from "./podcasts";

export interface PlayerContextValue {
  episode: PodcastEpisode | null;
  feed: PodcastFeed | null;
  playing: boolean;
  position: number;
  duration: number;
  load: (episode: PodcastEpisode, feed: PodcastFeed, resumeAt?: number) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setRate: (rate: number) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);
