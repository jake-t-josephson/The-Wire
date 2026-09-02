import { UA, CORS, NewsArticle, parseRSS, parseRingerPosts, interleave, byDateDesc } from "../_shared/rss.ts";

const ESPN_URL   = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50";
const PFT_URL    = "https://profootballtalk.nbcsports.com/feed/";
const RINGER_URL = "https://wp.theringer.com/wp-json/wp/v2/posts?categories=14&per_page=50&_fields=title,link,date,excerpt";

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

async function fetchPFT(): Promise<NewsArticle[]> {
  const res = await fetch(PFT_URL, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) return [];
  return parseRSS(await res.text(), "ProFootballTalk", 30);
}

async function fetchRinger(): Promise<NewsArticle[]> {
  const res = await fetch(RINGER_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  return parseRingerPosts(await res.json() as Record<string, unknown>[], "The Ringer");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const [espn, pft, ringer] = await Promise.allSettled([fetchESPN(), fetchPFT(), fetchRinger()]);

  const articles = interleave([
    espn.status   === "fulfilled" ? byDateDesc(espn.value)   : [],
    pft.status    === "fulfilled" ? byDateDesc(pft.value)    : [],
    ringer.status === "fulfilled" ? byDateDesc(ringer.value) : [],
  ]);

  return new Response(JSON.stringify({ articles }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
