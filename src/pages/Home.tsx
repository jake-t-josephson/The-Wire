import { useEffect, useState } from "react";
import { fetchFixtures, fetchNews, fetchStandings, groupMatchweeks, currentMatchweekIndex, type ESPNArticle, type ESPNFixture, type ESPNStandingEntry } from "../lib/espn";
import { fetchWireroom } from "../lib/supabase";
import type { WireroomBrief } from "../lib/articles";
import { ColumnSection, HomeSidebar, LiveRail, WireroomBlock } from "../features/home/HomeSections";

export default function Home() {
  const [fixtures, setFixtures] = useState<ESPNFixture[]>([]);
  const [standings, setStandings] = useState<ESPNStandingEntry[]>([]);
  const [gameweek, setGameweek] = useState("GW1");
  const [loadingData, setLoadingData] = useState(true);
  const [brief, setBrief] = useState<WireroomBrief | null>(null);
  const [fallbackArticles, setFallbackArticles] = useState<ESPNArticle[]>([]);
  const [loadingWireroom, setLoadingWireroom] = useState(true);

  useEffect(() => {
    Promise.all([fetchFixtures(), fetchStandings()])
      .then(([{ fixtures: nextFixtures, calendar }, nextStandings]) => {
        setFixtures(nextFixtures);
        setStandings(nextStandings);
        const matchweeks = groupMatchweeks(calendar);
        const current = matchweeks[currentMatchweekIndex(matchweeks)];
        if (current) setGameweek(current.label);
      })
      .finally(() => setLoadingData(false));

    fetchWireroom()
      .then((nextBrief) => {
        if (nextBrief) return setBrief(nextBrief);
        return fetchNews().then(setFallbackArticles);
      })
      .catch(() => fetchNews().then(setFallbackArticles))
      .finally(() => setLoadingWireroom(false));
  }, []);

  const liveGames = fixtures.filter((fixture) => fixture.competitions[0].status.type.state === "in");
  return (
    <>
      {liveGames.length > 0 && <LiveRail fixtures={liveGames} />}
      <div className="home-grid">
        <main className="home-editorial">
          <WireroomBlock brief={brief} fallbackArticles={fallbackArticles} loading={loadingWireroom} />
          <ColumnSection />
        </main>
        <aside className="home-sidebar">
          <HomeSidebar fixtures={fixtures} standings={standings} gameweek={gameweek} loading={loadingData} />
        </aside>
      </div>
    </>
  );
}
