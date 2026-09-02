import { NFL_TOTAL_WEEKS } from "../../lib/nfl";
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
import { useNFLDashboard, type NFLDashboardModel } from "../../features/nfl/useNFLDashboard";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NFLDashboard() {
  return <NFLDashboardView model={useNFLDashboard()} />;
}

export function NFLDashboardView({ model }: { model: NFLDashboardModel }) {
  const {
    activeConference: activeConf,
    changeWeek,
    conferenceTab: confTab,
    dateRange,
    games,
    gamesError: errorGames,
    leagueLogo,
    liveCount,
    loadingGames,
    loadingNews,
    loadingStandings: loadingStd,
    news,
    season,
    setConferenceTab: setConfTab,
    setStandingsView: setStandView,
    standingsError: errorStd,
    standingsView: standView,
    week,
  } = model;

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
