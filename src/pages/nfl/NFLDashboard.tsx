import { useState, useEffect } from "react";
import {
  fetchNFLScoreboard, fetchNFLStandings, fetchNFLNews,
  weekDateRange, NFL_TOTAL_WEEKS,
  type NFLGame, type NFLConference, type NFLArticle,
} from "../../lib/nfl";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { StatusDot } from "../../components/sports/StatusDot";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Skeleton } from "../../components/ui/Skeleton";
import { Eyebrow, SectionLabel } from "../../components/ui/Typography";
import { NFL_SOURCE_META } from "../../lib/sourceMeta";
import { PeriodNavigator } from "../../components/sports/PeriodNavigator";
import { NewsFeed } from "../../components/sports/NewsFeed";
import { SportDashboardLayout, SportDashboardMain, SportDashboardRail } from "../../components/layout/SportDashboardLayout";
import { GameRow } from "../../components/sports/GameRow";
import { toNFLGameRow } from "../../lib/adapters/nfl";
import { StandingsTable } from "../../components/sports/StandingsTable";
import { NFL_STANDING_COLUMNS, toNFLConferenceStandings, toNFLDivisionStandings } from "../../lib/adapters/standings";

// ── Page ──────────────────────────────────────────────────────────────────────

type StandingsView = "division" | "conference";
type ConfTab = "AFC" | "NFC";

export default function NFLDashboard() {
  const [week,         setWeek]         = useState<number>(1);
  const [season,       setSeason]       = useState<number>(new Date().getFullYear());
  const [games,        setGames]        = useState<NFLGame[]>([]);
  const [dateRange,    setDateRange]    = useState("");
  const [leagueLogo,   setLeagueLogo]   = useState<string | null>(null);
  const [conferences,  setConferences]  = useState<NFLConference[]>([]);
  const [standView,    setStandView]    = useState<StandingsView>("division");
  const [confTab,      setConfTab]      = useState<ConfTab>("AFC");
  const [news,         setNews]         = useState<NFLArticle[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingStd,   setLoadingStd]   = useState(true);
  const [loadingNews,  setLoadingNews]  = useState(true);
  const [errorGames,   setErrorGames]   = useState(false);
  const [errorStd,     setErrorStd]     = useState(false);

  // Initial load: get current week from API
  useEffect(() => {
    fetchNFLScoreboard()
      .then(({ week: w, season: s, games: g, leagueLogo: logo }) => {
        setWeek(w);
        setSeason(s);
        setGames(g);
        setDateRange(weekDateRange(g));
        if (logo) setLeagueLogo(logo);
      })
      .catch(() => setErrorGames(true))
      .finally(() => setLoadingGames(false));

    fetchNFLStandings()
      .then(setConferences)
      .catch(() => setErrorStd(true))
      .finally(() => setLoadingStd(false));

    fetchNFLNews()
      .then(setNews)
      .finally(() => setLoadingNews(false));
  }, []);

  const changeWeek = (nextWeek: number) => {
    setLoadingGames(true);
    setErrorGames(false);
    setWeek(nextWeek);
    fetchNFLScoreboard(nextWeek)
      .then(({ season: s, games: g }) => {
        setSeason(s);
        setGames(g);
        setDateRange(weekDateRange(g));
      })
      .catch(() => setErrorGames(true))
      .finally(() => setLoadingGames(false));
  };

  const liveCount  = games.filter((g) => g.competitions[0].status.type.state === "in").length;
  const activeConf = conferences.find((c) => c.shortName === confTab);

  return (
    <PageContainer>
      <PageHeader
        leading={leagueLogo && <img className="league-mark" src={leagueLogo} alt="NFL" />}
        eyebrow={<Eyebrow signal className="mb-2.5">NFL</Eyebrow>}
        title={`${season} Season`}
        actions={
          <>
            {liveCount > 0 && (
              <div className="label-caps flex items-center gap-1.5 text-signal">
                <StatusDot state="wire" />
                {liveCount} live
              </div>
            )}
            <PeriodNavigator
              label={`Wk ${week}`}
              detail={dateRange}
              previousLabel="Previous week"
              nextLabel="Next week"
              onPrevious={() => changeWeek(Math.max(1, week - 1))}
              onNext={() => changeWeek(Math.min(NFL_TOTAL_WEEKS, week + 1))}
              previousDisabled={week <= 1}
              nextDisabled={week >= NFL_TOTAL_WEEKS}
            />
          </>
        }
      />

      <SportDashboardLayout>
        {/* Left: Scoreboard */}
        <SportDashboardMain>
          <SectionLabel className="mb-5">Week {week} · {games.length} Games</SectionLabel>

          {loadingGames ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : errorGames ? (
            <p className="empty-state">Couldn't load games.</p>
          ) : games.length === 0 ? (
            <p className="empty-state">No games scheduled this week.</p>
          ) : (
            <div>
              {games.map((game) => <GameRow key={game.id} game={toNFLGameRow(game)} />)}
            </div>
          )}

          {/* News */}
          {!loadingNews && news.length > 0 && (
            <div className="mt-10">
              <SectionLabel className="mb-4">News</SectionLabel>
              <NewsFeed articles={news} sources={NFL_SOURCE_META} />
            </div>
          )}
          {loadingNews && (
            <div className="mt-10 space-y-3">
              <SectionLabel className="mb-4">News</SectionLabel>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={68} />)}
            </div>
          )}
        </SportDashboardMain>

        {/* Right: Standings */}
        <SportDashboardRail>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <SectionLabel>Standings</SectionLabel>
            <div className="ml-auto flex items-center gap-2">
              <SegmentedControl
                label="Standings view"
                value={standView}
                onChange={setStandView}
                items={[
                  { value: "division",   label: "Division" },
                  { value: "conference", label: "Conference" },
                ]}
              />
            </div>
          </div>

          {/* Conference tabs */}
          <div className="conference-tabs">
            {(["AFC", "NFC"] as const).map((c) => (
              <Button
                variant="bare"
                key={c}
                onClick={() => setConfTab(c)}
                className="conference-tabs__item"
                data-active={confTab === c || undefined}
                aria-pressed={confTab === c}
              >
                {c}
              </Button>
            ))}
          </div>

          <div id="nfl-standings-panel">
            {loadingStd ? (
              <div className="space-y-2">
                {Array.from({ length: 16 }).map((_, i) => <Skeleton key={i} height={30} />)}
              </div>
            ) : errorStd ? (
              <p className="empty-state">Couldn't load standings.</p>
            ) : activeConf ? (
              <div className="standings-table-scroll">
                <StandingsTable
                  columns={NFL_STANDING_COLUMNS}
                  groups={standView === "division" ? toNFLDivisionStandings(activeConf) : toNFLConferenceStandings(activeConf)}
                  ranked={standView === "conference"}
                />
              </div>
            ) : null}
          </div>
        </SportDashboardRail>
      </SportDashboardLayout>
    </PageContainer>
  );
}
