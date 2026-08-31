const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ESPN_URL   = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50";
const PFT_URL    = "https://profootballtalk.nbcsports.com/feed/";
const RINGER_URL = "https://wp.theringer.com/wp-json/wp/v2/posts?categories=14&per_page=50&_fields=title,link,date,excerpt";
const UA         = "Mozilla/5.0 (compatible; TheWire/1.0)";

interface NFLArticle {
  headline:    string;
  description: string;
  published:   string;
  url:         string;
  source:      string;
}

// ── ESPN ──────────────────────────────────────────────────────────────────────

async function fetchESPN(): Promise<NFLArticle[]> {
  const res  = await fetch(ESPN_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.articles ?? []) as Record<string, unknown>[]).map((a) => ({
    headline:    (a.headline as string) ?? "",
    description: (a.description as string) ?? "",
    published:   (a.published as string) ?? "",
    url:         ((a.links as { web: { href: string } })?.web?.href) ?? "",
    source:      "ESPN",
  })).filter((a) => a.headline && a.url);
}

// ── ProFootballTalk ───────────────────────────────────────────────────────────

function rssTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[([^\]]*)\]\]>/g, "$1").trim() : "";
}

function decodeHtml(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

async function fetchPFT(): Promise<NFLArticle[]> {
  const res = await fetch(PFT_URL, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) return [];
  const xml   = await res.text();
  const items = xml.split(/<item[\s>]/i).slice(1);
  return items.slice(0, 30).map((item) => ({
    headline:    decodeHtml(rssTag(item, "title")),
    description: decodeHtml(rssTag(item, "description")),
    published:   rssTag(item, "pubDate"),
    url:         decodeHtml(rssTag(item, "link")),
    source:      "ProFootballTalk",
  })).filter((a) => a.headline && a.url);
}

// ── The Ringer ────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchRinger(): Promise<NFLArticle[]> {
  const res = await fetch(RINGER_URL, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return [];
  const posts = await res.json() as Record<string, unknown>[];
  return posts.map((p) => ({
    headline:    stripHtml((p.title as { rendered: string })?.rendered ?? ""),
    description: stripHtml((p.excerpt as { rendered: string })?.rendered ?? ""),
    published:   (p.date as string) ?? "",
    url:         (p.link as string) ?? "",
    source:      "The Ringer",
  })).filter((a) => a.headline && a.url);
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const [espn, pft, ringer] = await Promise.allSettled([fetchESPN(), fetchPFT(), fetchRinger()]);

  // Sort each source by date descending, then interleave round-robin so all
  // sources stay visible regardless of publishing frequency differences.
  const bySource = [
    espn.status   === "fulfilled" ? espn.value   : [],
    pft.status    === "fulfilled" ? pft.value    : [],
    ringer.status === "fulfilled" ? ringer.value : [],
  ].map((src) => [...src].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()));

  const articles: NFLArticle[] = [];
  const max = Math.max(...bySource.map((s) => s.length));
  for (let i = 0; i < max; i++) {
    for (const src of bySource) {
      if (src[i]) articles.push(src[i]);
    }
  }

  return new Response(JSON.stringify({ articles }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
