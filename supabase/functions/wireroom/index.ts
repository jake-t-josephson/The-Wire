import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MS    = 15 * 60 * 1000;
const ESPN_NEWS       = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=20";
const GUARDIAN_RSS    = "https://www.theguardian.com/football/premierleague/rss";
const UA              = "Mozilla/5.0 (compatible; TheWire/1.0)";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawArticle {
  url:       string;
  source:    string;    // 'ESPN' | 'The Guardian'
  sourceKey: string;   // 'espn' | 'guardian'
  headline:  string;
  body:      string;
  published: string;
}

interface Section {
  theme:   string;   // "Results" | "Transfers" | "Managers" | "Table"
  heading: string;
  body:    string;
  links:   Array<{ label: string; url: string }>;
}

interface Brief {
  title:    string;
  sections: Section[];
}

// ── Source fetchers ───────────────────────────────────────────────────────────

async function fetchEspn(): Promise<RawArticle[]> {
  try {
    const res = await fetch(ESPN_NEWS, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).map((a: Record<string, unknown>) => ({
      url:       (a.links as Record<string, Record<string, string>>)?.web?.href ?? "",
      source:    "ESPN",
      sourceKey: "espn",
      headline:  (a.headline as string) ?? "",
      body:      (a.description as string) ?? "",
      published: (a.published as string) ?? new Date().toISOString(),
    })).filter((a: RawArticle) => a.url && a.headline);
  } catch { return []; }
}

function rssTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function decodeHtml(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function cleanDesc(raw: string): string {
  return decodeHtml(raw).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
}

async function fetchGuardian(): Promise<RawArticle[]> {
  try {
    const res = await fetch(GUARDIAN_RSS, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    const xml = await res.text();
    const articles: RawArticle[] = [];
    for (const match of xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g)) {
      const item     = match[1];
      const headline = rssTag(item, "title");
      const link     = rssTag(item, "link");
      const pubDate  = rssTag(item, "pubDate");
      const desc     = cleanDesc(rssTag(item, "description"));
      if (headline && link) {
        articles.push({ url: link, source: "The Guardian", sourceKey: "guardian", headline, body: desc, published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString() });
      }
    }
    return articles;
  } catch { return []; }
}

// ── AI brief generation ───────────────────────────────────────────────────────

// Returns null when AI generation fails; callers fall back to the last stored brief.
async function generateBrief(articles: RawArticle[]): Promise<Brief | null> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key || articles.length === 0) return null;

  const articleText = articles.slice(0, 15)
    .map((a, i) => `${i + 1}. [${a.source}] ${a.headline}\n${a.body}`)
    .join("\n\n");

  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:       "openai/gpt-oss-120b",
        max_tokens:  3000,
        temperature: 0.5,
        messages: [{
          role:    "user",
          content: `You are the staff writer for The Wire, a private Premier League editorial read by one family. Write the weekly Wireroom — a real article, not a brief. It should read like a smart friend summarizing the week: what happened on the pitch, what's moving in the transfer window, any manager news, and who to watch in the table.

Write original prose synthesized across multiple sources. Don't copy headlines or summaries — write your own sentences. Cover 3-4 themes (results, transfers, managers, table — include only themes with actual news from the articles). For each theme, include 2-3 article links so the reader can dig deeper.

Return ONLY valid JSON — no markdown, no preamble:
{
  "title": "week headline in ALL CAPS — punchy, 6-10 words (e.g. 'FERNANDES FIRES, TRANSFER WINDOW SLAMS SHUT')",
  "sections": [
    {
      "theme": "Results",
      "heading": "section heading in ALL CAPS, 5-10 words",
      "body": "150-200 word original editorial paragraph synthesizing what happened. Confident, conversational, journalistic.",
      "links": [
        { "label": "short article title (5-8 words)", "url": "exact article url from source articles" }
      ]
    }
  ]
}

Include 3-4 sections. Only include a theme if there are real facts to write about. Links: 2-3 per section, exact URLs from source material only — no invented URLs.

Source articles:
${articleText}`,
        }],
      }),
    });
  } catch { return null; }

  if (!res.ok) return null;

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content as string) ?? "";

  // Extract outermost JSON object using bracket balancing
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0, inStr = false, escaped = false, end = -1;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escaped)          { escaped = false; continue; }
    if (c === "\\" && inStr) { escaped = true; continue; }
    if (c === '"')        { inStr = !inStr; continue; }
    if (inStr)            continue;
    if (c === "{")        depth++;
    else if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;

  const candidate = text.slice(start, end + 1)
    .replace(/\}\s*\n(\s*)\{/g, "},\n$1{")
    .replace(/\]\s*\n(\s*)\[/g, "],\n$1[");
  try { return JSON.parse(candidate) as Brief; } catch { return null; }
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body   = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const forced = body?.force === true;

  // Check if we have a fresh brief already
  const { data: latest } = await supabase
    .from("wireroom_briefs")
    .select("*")
    .eq("league", "epl")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!forced && latest && Date.now() - new Date(latest.generated_at).getTime() < CACHE_TTL_MS) {
    const stored = latest.lead_brief as Brief;
    return Response.json(
      {
        title:       stored.title,
        sections:    stored.sections,
        sourceCount: latest.source_count,
        generatedAt: latest.generated_at,
        cached:      true,
      },
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  // Fetch all sources in parallel
  const [espn, guardian] = await Promise.all([fetchEspn(), fetchGuardian()]);
  const all = [...espn, ...guardian].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  // Persist every article (upsert — update fetched_at if seen before)
  if (all.length > 0) {
    await supabase.from("articles").upsert(
      all.map((a) => ({
        id:          a.url,
        source:      a.sourceKey,
        source_label: a.source,
        league:      "epl",
        headline:    a.headline,
        description: a.body,
        url:         a.url,
        published_at: a.published,
        fetched_at:  new Date().toISOString(),
      })),
      { onConflict: "id" },
    );
  }

  // Build a source-balanced set for Groq: top 8 per source, then sort by date
  const bySource = new Map<string, RawArticle[]>();
  for (const a of all) {
    const bucket = bySource.get(a.sourceKey) ?? [];
    if (bucket.length < 8) bucket.push(a);
    bySource.set(a.sourceKey, bucket);
  }
  const top = [...bySource.values()].flat().sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  ).slice(0, 16);
  const brief = await generateBrief(top);

  // AI generation failed — serve the last stored brief rather than a raw fallback
  if (!brief) {
    if (latest) {
      const stored = latest.lead_brief as Brief;
      return Response.json(
        {
          title:       stored.title,
          sections:    stored.sections,
          sourceCount: latest.source_count,
          generatedAt: latest.generated_at,
          cached:      true,
        },
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ error: "No brief available" }), {
      status: 503, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { data: inserted } = await supabase
    .from("wireroom_briefs")
    .insert({
      league:       "epl",
      generated_at: new Date().toISOString(),
      lead_brief:   brief,
      secondaries:  [],
      source_count: all.length,
      article_ids:  top.map((a) => a.url),
    })
    .select("id")
    .single();

  return Response.json(
    {
      id:          inserted?.id,
      title:       brief.title,
      sections:    brief.sections,
      sourceCount: all.length,
      generatedAt: new Date().toISOString(),
      cached:      false,
    },
    { headers: { ...CORS, "Content-Type": "application/json" } },
  );
});
