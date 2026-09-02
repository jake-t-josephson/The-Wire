import { UA, CORS, NewsArticle, parseRSS, parseRingerPosts, interleave, byDateDesc } from "../_shared/rss.ts";

const ESPN_URL   = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=50";
const GUARDIAN_URL = "https://www.theguardian.com/football/premierleague/rss";
const BBC_URL      = "https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml";
const SKY_URL      = "https://www.skysports.com/rss/11095";
const RINGER_URL   = "https://wp.theringer.com/wp-json/wp/v2/posts?categories=1003&per_page=50&_fields=title,link,date,excerpt";

async function fetchESPN(): Promise<NewsArticle[]> {
  const res = await fetch(ESPN_URL, { headers: { "User-Agent": UA } });
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

async function fetchRSS(url: string, source: string, limit?: number): Promise<NewsArticle[]> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return parseRSS(await res.text(), source, limit);
}

async function fetchRinger(): Promise<NewsArticle[]> {
  const res = await fetch(RINGER_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return parseRingerPosts(await res.json() as Record<string, unknown>[], "The Ringer");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const [espn, guardian, bbc, sky, ringer] = await Promise.allSettled([
    fetchESPN(),
    fetchRSS(GUARDIAN_URL, "The Guardian", 20),
    fetchRSS(BBC_URL, "BBC Sport", 39),
    fetchRSS(SKY_URL, "Sky Sports", 20),
    fetchRinger(),
  ]);

  const articles = interleave([
    espn.status     === "fulfilled" ? byDateDesc(espn.value)     : [],
    guardian.status === "fulfilled" ? byDateDesc(guardian.value) : [],
    bbc.status      === "fulfilled" ? byDateDesc(bbc.value)      : [],
    sky.status      === "fulfilled" ? byDateDesc(sky.value)      : [],
    ringer.status   === "fulfilled" ? byDateDesc(ringer.value)   : [],
  ]);

  return new Response(JSON.stringify({ articles }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
