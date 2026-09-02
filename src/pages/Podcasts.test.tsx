import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PodcastEpisode, PodcastProgress } from "../lib/podcasts";
import { EpisodeRow } from "./Podcasts";

describe("EpisodeRow", () => {
  it("exposes listening progress without an inline width style", () => {
    const episode: PodcastEpisode = {
      guid: "episode-1",
      feed_id: "feed-1",
      title: "The Wire Weekly",
      description: null,
      enclosure_url: "https://example.com/episode.mp3",
      duration_seconds: 120,
      pub_date: "2026-09-01T12:00:00Z",
      artwork_url: null,
    };
    const progress: PodcastProgress = {
      episode_guid: episode.guid,
      position_seconds: 60,
      completed: false,
      last_played_at: "2026-09-01T12:01:00Z",
    };
    render(<EpisodeRow episode={episode} progress={progress} active={false} onPlay={vi.fn()} />);
    expect(screen.getByRole("progressbar", { name: "50% played" })).toHaveValue(50);
  });
});
