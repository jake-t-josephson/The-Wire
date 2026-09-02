import { type Article } from "./articles";

const NYT_SEARCH = "https://api.nytimes.com/svc/search/v2/articlesearch.json";

interface NytDoc {
  _id: string;
  web_url: string;
  headline: { main: string };
  abstract: string;
  pub_date: string;
  news_desk: string;
  section_name: string;
  multimedia: Array<{ url: string; subtype: string }>;
}

interface NytResponse {
  status: string;
  response?: { docs: NytDoc[] };
}

// Activates automatically once VITE_NYT_API_KEY is set in .env.
export async function fetchNytArticles(): Promise<Article[]> {
  const key = import.meta.env.VITE_NYT_API_KEY as string | undefined;
  if (!key) return [];

  try {
    const params = new URLSearchParams({
      q:         '"Premier League" OR "EPL" OR "English soccer"',
      sort:      "newest",
      "api-key": key,
    });

    const res = await fetch(`${NYT_SEARCH}?${params}`);
    if (!res.ok) return [];

    const data: NytResponse = await res.json();
    if (data.status !== "OK" || !data.response?.docs) return [];

    return data.response.docs.map((doc): Article => {
      const isAthletic =
        doc.news_desk === "The Athletic" || doc.section_name === "The Athletic";
      const thumb = doc.multimedia.find((m) => m.subtype === "thumbnail");

      return {
        id:          doc._id,
        source:      isAthletic ? "athletic" : "nyt",
        sourceLabel: isAthletic ? "The Athletic" : "NY Times",
        url:         doc.web_url,
        headline:    doc.headline.main,
        description: doc.abstract,
        published:   doc.pub_date,
        imageUrl:    thumb ? `https://www.nytimes.com/${thumb.url}` : undefined,
      };
    });
  } catch {
    return [];
  }
}
