export const UA = "Mozilla/5.0 (compatible; TheWire/1.0)";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface NewsArticle {
  headline:    string;
  description: string;
  published:   string;
  url:         string;
  source:      string;
}

export function rssTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[([^\]]*)\]\]>/g, "$1").trim() : "";
}

export function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function parseRSS(xml: string, source: string, limit?: number): NewsArticle[] {
  const items = xml.split(/<item[\s>]/i).slice(1);
  return (limit ? items.slice(0, limit) : items).map((item) => ({
    headline:    decodeHtml(rssTag(item, "title")),
    description: decodeHtml(stripHtml(rssTag(item, "description"))),
    published:   rssTag(item, "pubDate"),
    url:         decodeHtml(rssTag(item, "link")),
    source,
  })).filter((a) => a.headline && a.url);
}

export function parseRingerPosts(posts: Record<string, unknown>[], source: string): NewsArticle[] {
  return posts.map((p) => ({
    headline:    stripHtml((p.title as { rendered: string })?.rendered ?? ""),
    description: stripHtml((p.excerpt as { rendered: string })?.rendered ?? ""),
    published:   (p.date as string) ?? "",
    url:         (p.link as string) ?? "",
    source,
  })).filter((a) => a.headline && a.url);
}

export function interleave<T>(sources: T[][]): T[] {
  const sorted = sources.map((src) => [...src]);
  const out: T[] = [];
  const max = Math.max(...sorted.map((s) => s.length), 0);
  for (let i = 0; i < max; i++) {
    for (const src of sorted) {
      if (src[i] !== undefined) out.push(src[i]);
    }
  }
  return out;
}

export function byDateDesc<T extends { published: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
}
