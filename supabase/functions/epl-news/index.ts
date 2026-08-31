const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ESPN_URL     = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=50";
const GUARDIAN_URL = "https://www.theguardian.com/football/premierleague/rss";
const BBC_URL      = "https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml";
const SKY_URL      = "https://www.skysports.com/rss/11095";
const RINGER_URL   = "https://wp.theringer.com/wp-json/wp/v2/posts?categories=1003&per_page=50&_fields=title,link,date,excerpt";
const UA           = "Mozilla/5.0 (compatible; TheWire/1.0)";

interface EPLArticle {
  headline:    string;
  description: string;
  published:   string;
  url:         string;
  source:      string;
}

// ── ESPN ──────────────────────────────────────────────────────────────────────

async function fetchESPN(): Promise<EPLArticle[]> {
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

// ── RSS helpers ───────────────────────────────────────────────────────────────

function rssTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[([^\]]*)\]\]>/g, "$1").trim() : "";
}

function decodeHtml(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseRSS(xml: string, source: string): EPLArticle[] {
  const items = xml.split(/<item[\s>]/i).slice(1);
  return items.map((item) => ({
    headline:    decodeHtml(stripHtml(rssTag(item, "title"))),
    description: decodeHtml(stripHtml(rssTag(item, "description"))),
    published:   rssTag(item, "pubDate"),
    url:         decodeHtml(rssTag(item, "link")),
    source,
  })).filter((a) => a.headline && a.url);
}

// ── Guardian ──────────────────────────────────────────────────────────────────

async function fetchGuardian(): Promise<EPLArticle[]> {
  const res = await fetch(GUARDIAN_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return parseRSS(await res.text(), "The Guardian");
}

// ── BBC Sport ─────────────────────────────────────────────────────────────────

async function fetchBBC(): Promise<EPLArticle[]> {
  const res = await fetch(BBC_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return parseRSS(await res.text(), "BBC Sport");
}

// ── Sky Sports ────────────────────────────────────────────────────────────────

async function fetchSky(): Promise<EPLArticle[]> {
  const res = await fetch(SKY_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return parseRSS(await res.text(), "Sky Sports");
}

// ── The Ringer ────────────────────────────────────────────────────────────────

async function fetchRinger(): Promise<EPLArticle[]> {
  const res = await fetch(RINGER_URL, { headers: { "User-Agent": UA } });
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

  const [espn, guardian, bbc, sky, ringer] = await Promise.allSettled([
    fetchESPN(), fetchGuardian(), fetchBBC(), fetchSky(), fetchRinger(),
  ]);

  const bySource = [
    espn.status     === "fulfilled" ? espn.value     : [],
    guardian.status === "fulfilled" ? guardian.value : [],
    bbc.status      === "fulfilled" ? bbc.value      : [],
    sky.status      === "fulfilled" ? sky.value      : [],
    ringer.status   === "fulfilled" ? ringer.value   : [],
  ].map((src) => [...src].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()));

  // Round-robin interleave so all sources stay visible
  const articles: EPLArticle[] = [];
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
