import { supabase } from "./supabase";

export interface PodcastFeed {
  id:              string;
  feed_url:        string;
  title:           string | null;
  artwork_url:     string | null;
  leagues:         string[];
  last_fetched_at: string | null;
}

export interface PodcastEpisode {
  guid:             string;
  feed_id:          string;
  title:            string;
  description:      string | null;
  enclosure_url:    string;
  duration_seconds: number | null;
  pub_date:         string | null;
  artwork_url:      string | null;
}

export interface PodcastProgress {
  episode_guid:     string;
  position_seconds: number;
  completed:        boolean;
  last_played_at:   string;
}

export async function fetchFeeds(): Promise<PodcastFeed[]> {
  const { data, error } = await supabase
    .from("podcast_feeds")
    .select("id, feed_url, title, artwork_url, leagues, last_fetched_at")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PodcastFeed[];
}

export async function fetchEpisodes(feedId: string, limit = 20): Promise<PodcastEpisode[]> {
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("guid, feed_id, title, description, enclosure_url, duration_seconds, pub_date, artwork_url")
    .eq("feed_id", feedId)
    .order("pub_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PodcastEpisode[];
}

export async function fetchProgress(guids: string[]): Promise<Map<string, PodcastProgress>> {
  if (guids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("podcast_progress")
    .select("episode_guid, position_seconds, completed, last_played_at")
    .in("episode_guid", guids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((r) => [r.episode_guid as string, r as PodcastProgress]));
}

export async function upsertProgress(
  episodeGuid: string,
  positionSeconds: number,
  completed: boolean,
): Promise<void> {
  await supabase.from("podcast_progress").upsert(
    { episode_guid: episodeGuid, position_seconds: Math.floor(positionSeconds), completed, last_played_at: new Date().toISOString() },
    { onConflict: "episode_guid" },
  );
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPubDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
