import { fetchCFBCurrentPoll, fetchCFBNews } from "./lib/espn.ts";
import { upsertLeague, upsertCFBPollSnapshot, hasCFBPollSnapshot, upsertNews, logSync } from "./lib/db.ts";

async function syncCFB() {
  console.log(`[sync:cfb] ${new Date().toISOString()} — starting`);

  await upsertLeague({
    slug:        "cfb",
    apiId:       "23",
    name:        "College Football",
    logoUrl:     null,
    darkLogoUrl: null,
  });

  // 1. AP Poll snapshot — only store once per week (poll is published Saturday morning)
  const { season, week, rankings } = await fetchCFBCurrentPoll();
  console.log(`[sync:cfb] season ${season} week ${week}, ${rankings.length} ranked teams`);

  if (rankings.length > 0) {
    const alreadyStored = await hasCFBPollSnapshot(season, week);
    await upsertCFBPollSnapshot(rankings, season, week);
    console.log(`[sync:cfb] poll snapshot ${alreadyStored ? "updated" : "saved"} for season ${season} week ${week}`);
  }

  // 2. News
  const articles = await fetchCFBNews();
  for (const article of articles) {
    await upsertNews(article, "cfb");
  }
  console.log(`[sync:cfb] synced ${articles.length} news articles`);

  await logSync("cfb", "ok");
  console.log("[sync:cfb] done");
}

syncCFB().catch(async (err) => {
  console.error("[sync:cfb] error:", err);
  await logSync("cfb", "error", String(err)).catch(() => {});
  process.exit(1);
});
