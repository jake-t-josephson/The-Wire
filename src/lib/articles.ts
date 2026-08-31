// Unified article type used across all sources (ESPN, NYT, Athletic, Ringer).

export type ArticleSource = "espn" | "nyt" | "athletic" | "ringer";

export interface Article {
  id: string;
  source: ArticleSource;
  sourceLabel: string;
  url: string;
  headline: string;
  description: string;
  published: string; // ISO 8601
  imageUrl?: string;
}

export interface WireroomSection {
  theme:   string;
  heading: string;
  body:    string;
  links:   Array<{ label: string; url: string }>;
}

// AI-generated weekly roundup returned by the Edge Function.
export interface WireroomBrief {
  title:       string;
  sections:    WireroomSection[];
  sourceCount: number;
  generatedAt: string;
  cached:      boolean;
}

const EPL_TERMS = [
  "premier league", "epl",
  "man city", "manchester city", "man united", "manchester united",
  "liverpool", "arsenal", "chelsea", "tottenham", "spurs",
  "newcastle", "aston villa", "west ham", "brighton", "brentford",
  "fulham", "everton", "nottm forest", "nottingham forest",
  "bournemouth", "wolves", "wolverhampton", "crystal palace",
  "ipswich", "leicester", "southampton",
];

export function isEplRelevant(headline: string, description = ""): boolean {
  const text = `${headline} ${description}`.toLowerCase();
  return EPL_TERMS.some((t) => text.includes(t));
}

export function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.headline.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );
}
