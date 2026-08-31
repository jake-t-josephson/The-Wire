import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (compatible; TheWire/1.0)";

// ── RSS helpers ───────────────────────────────────────────────────────────────

function xmlTag(xml: string, tag: string): string {
  // Handles CDATA, namespaced tags (itunes:duration), and plain tags
  const m = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"),
  );
  return m ? m[1].trim() : "";
}

function xmlAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]+${attr}="([^"]*)"`, "i"));
  return m ? m[1].trim() : "";
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

function parseDuration(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Plain seconds: "2745"
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  // HH:MM:SS or MM:SS
  const parts = trimmed.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

interface Episode {
  guid:             string;
  title:            string;
  description:      string;
  enclosure_url:    string;
  duration_seconds: number | null;
  pub_date:         string | null;
  artwork_url:      string | null;
}

interface FeedMeta {
  title:       string;
  artwork_url: string;
}

function parseFeed(xml: string): { meta: FeedMeta; episodes: Episode[] } {
  const channel = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i)?.[1] ?? xml;

  // Feed-level metadata (before first <item>)
  const beforeFirstItem = channel.split(/<item[\s>]/i)[0];
  const feedTitle      = stripHtml(xmlTag(beforeFirstItem, "title"));
  const feedArtwork    = xmlAttr(beforeFirstItem, "itunes:image", "href") ||
                         xmlTag(beforeFirstItem, "itunes:image") ||
                         xmlAttr(beforeFirstItem, "image", "href") ||
                         xmlTag(beforeFirstItem.match(/<image[^>]*>([\s\S]*?)<\/image>/i)?.[1] ?? "", "url");

  const episodes: Episode[] = [];
  for (const match of xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)) {
    const item = match[1];

    const rawGuid     = xmlTag(item, "guid");
    const enclosure   = xmlAttr(item, "enclosure", "url");
    const guid        = rawGuid || enclosure;
    if (!guid || !enclosure) continue;

    const title       = stripHtml(xmlTag(item, "title"));
    const description = stripHtml(xmlTag(item, "description") || xmlTag(item, "itunes:summary"));
    const duration    = parseDuration(xmlTag(item, "itunes:duration"));
    const pubDateStr  = xmlTag(item, "pubDate");
    const pubDate     = pubDateStr ? new Date(pubDateStr).toISOString() : null;
    const artworkHref = xmlAttr(item, "itunes:image", "href") || xmlTag(item, "itunes:image");
    const artwork     = artworkHref || null;

    episodes.push({ guid, title, description, enclosure_url: enclosure, duration_seconds: duration, pub_date: pubDate, artwork_url: artwork });
  }

  return { meta: { title: feedTitle, artwork_url: feedArtwork }, episodes };
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: feeds, error: feedsErr } = await supabase
    .from("podcast_feeds")
    .select("id, feed_url");

  if (feedsErr) {
    return new Response(JSON.stringify({ error: feedsErr.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const summary: Array<{ feed: string; episodes: number; error?: string }> = [];

  for (const feed of feeds ?? []) {
    try {
      const res = await fetch(feed.feed_url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();

      const { meta, episodes } = parseFeed(xml);

      // Update feed metadata
      await supabase.from("podcast_feeds").update({
        title:          meta.title || undefined,
        artwork_url:    meta.artwork_url || undefined,
        last_fetched_at: new Date().toISOString(),
      }).eq("id", feed.id);

      // Upsert episodes — never touch podcast_progress
      if (episodes.length > 0) {
        const rows = episodes.slice(0, 50).map((ep) => ({
          ...ep,
          feed_id: feed.id,
        }));
        const { error: upsertErr } = await supabase
          .from("podcast_episodes")
          .upsert(rows, { onConflict: "guid", ignoreDuplicates: false });
        if (upsertErr) throw new Error(upsertErr.message);
      }

      summary.push({ feed: meta.title || feed.feed_url, episodes: episodes.length });
    } catch (e) {
      console.error("Feed failed:", feed.feed_url, e);
      summary.push({ feed: feed.feed_url, episodes: 0, error: String(e) });
    }
  }

  return Response.json({ ok: true, summary }, { headers: CORS });
});
