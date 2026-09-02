import { isEplRelevant, type Article } from "./articles";

const RSS2JSON    = "https://api.rss2json.com/v1/api.json";
const RINGER_FEED = "https://www.theringer.com/rss/index.xml";

interface Rss2JsonItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  thumbnail?: string;
  enclosure?: { link?: string };
}

interface Rss2JsonResponse {
  status: "ok" | "error";
  items?: Rss2JsonItem[];
}

export async function fetchRingerArticles(): Promise<Article[]> {
  try {
    const url = `${RSS2JSON}?rss_url=${encodeURIComponent(RINGER_FEED)}&count=30`;
    const res  = await fetch(url);
    if (!res.ok) return [];

    const data: Rss2JsonResponse = await res.json();
    if (data.status !== "ok" || !data.items) return [];

    return data.items
      .filter((item) => isEplRelevant(item.title, item.description))
      .map((item): Article => ({
        id:          item.link,
        source:      "ringer",
        sourceLabel: "The Ringer",
        url:         item.link,
        headline:    item.title,
        description: stripHtml(item.description),
        published:   new Date(item.pubDate).toISOString(),
        imageUrl:    item.thumbnail || item.enclosure?.link,
      }));
  } catch {
    return [];
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
}
