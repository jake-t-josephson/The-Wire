import type { Matchweek } from "../../lib/espn";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { StatusDot } from "../../components/sports/StatusDot";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Skeleton } from "../../components/ui/Skeleton";
import { Tabs } from "../../components/ui/Tabs";
import { Eyebrow, SectionLabel } from "../../components/ui/Typography";
import { EPL_SOURCE_META } from "../../lib/sourceMeta";
import { PeriodNavigator } from "../../components/sports/PeriodNavigator";
import { NewsFeed } from "../../components/sports/NewsFeed";
import { SportDashboardLayout, SportDashboardMain, SportDashboardRail } from "../../components/layout/SportDashboardLayout";
import { GameRow } from "../../components/sports/GameRow";
import { toEPLGameRow } from "../../lib/adapters/epl";
import { StandingsLegend, StandingsTable } from "../../components/sports/StandingsTable";
import { EPL_STANDING_COLUMNS, toEPLStandings } from "../../lib/adapters/standings";
import { useEPLDashboard, type EPLDashboardModel } from "../../features/epl/useEPLDashboard";

function matchweekDateRange(matchweek: Matchweek) {
  const format = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const start = format(matchweek.dates[0]);
  const end = matchweek.dates.length > 1 ? format(matchweek.dates[matchweek.dates.length - 1]) : null;
  return end ? `${start} · ${end}` : start;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EPLDashboard() {
  return <EPLDashboardView model={useEPLDashboard()} />;
}

export function EPLDashboardView({ model }: { model: EPLDashboardModel }) {
  const {
    changeMatchweek,
    currentMatchweek: currentMw,
    days,
    fixtures,
    fixturesError: errorFix,
    leagueLogo,
    liveCount,
    loadingFixtures: loadingFix,
    loadingNews,
    loadingSnapshot: loadingSnap,
    loadingStandings: loadingStd,
    matchweekIndex: mwIndex,
    matchweeks,
    matchweekStats: mwStats,
    news,
    positionChanges: posChanges,
    setStandingsMode,
    snapshotStandings,
    standings,
    standingsError: errorStd,
    standingsMode,
  } = model;

  return (
    <PageContainer>
      <PageHeader
        leading={leagueLogo && <img className="league-mark" src={leagueLogo} alt="Premier League" />}
        eyebrow={<Eyebrow signal className="mb-2.5">Premier League</Eyebrow>}
        title="2026–27 Season"
        actions={
          <>
          {liveCount > 0 && (
            <div className="label-caps flex items-center gap-1.5 text-signal">
              <StatusDot state="wire" />
              {liveCount} live
            </div>
          )}
          {matchweeks.length > 0 && mwIndex !== null && (
            <PeriodNavigator
              label={matchweeks[mwIndex] ? `MW ${matchweeks[mwIndex].number}` : "MW 1"}
              detail={matchweeks[mwIndex] ? matchweekDateRange(matchweeks[mwIndex]) : undefined}
              previousLabel="Previous matchweek"
              nextLabel="Next matchweek"
              onPrevious={() => changeMatchweek(Math.max(0, mwIndex - 1))}
              onNext={() => changeMatchweek(Math.min(matchweeks.length - 1, mwIndex + 1))}
              previousDisabled={mwIndex === 0}
              nextDisabled={mwIndex === matchweeks.length - 1}
              options={matchweeks.map((mw, i) => ({ label: `MW ${mw.number}`, value: i }))}
              selectedIndex={mwIndex}
              onSelect={changeMatchweek}
            />
          )}
          </>
        }
      />

      {/* Tab bar */}
      <Tabs
        label="Premier League sections"
        value="fixtures"
        panelId="epl-fixtures-panel"
        items={[
          { label: "Fixtures", value: "fixtures" },
          { label: "Table", value: "table", disabled: true },
          { label: "Wireroom", value: "wireroom", disabled: true },
          { label: "Stats", value: "stats", disabled: true },
          { label: "Clubs", value: "clubs", disabled: true },
        ]}
      />

      {/* Content grid */}
      <SportDashboardLayout id="epl-fixtures-panel" role="tabpanel" aria-label="Fixtures">
        {/* Left: Fixtures */}
        <SportDashboardMain>
          <SectionLabel className="mb-5">
            Fixtures{currentMw ? ` — ${currentMw.label}` : ""}
          </SectionLabel>

          {loadingFix ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : errorFix ? (
            <p className="empty-state">Couldn't load fixtures.</p>
          ) : fixtures.length === 0 ? (
            <p className="empty-state">No fixtures this gameweek.</p>
          ) : (
            <div>
              {days.map(({ label, fixtures: dayFixtures }) => (
                <div key={label}>
                  <div className="eyebrow eyebrow--signal mb-3 mt-[22px]">
                    {label}
                  </div>
                  {dayFixtures.map((fixture) => <GameRow key={fixture.id} game={toEPLGameRow(fixture)} />)}
                </div>
              ))}
            </div>
          )}

          {/* News */}
          {!loadingNews && news.length > 0 && (
            <div className="mt-10">
              <SectionLabel className="mb-4">News</SectionLabel>
              <NewsFeed articles={news} sources={EPL_SOURCE_META} />
            </div>
          )}
        </SportDashboardMain>

        {/* Right: Standings */}
        <SportDashboardRail>
          <div className="mb-[18px] flex items-center gap-3">
            <SectionLabel>Standings</SectionLabel>
            <div className="ml-auto">
              <SegmentedControl
                label="Standings view"
                value={standingsMode}
                onChange={setStandingsMode}
                items={[
                  { value: "snapshot", label: currentMw ? `MW ${currentMw.number}` : "—", disabled: snapshotStandings.length === 0 },
                  { value: "live", label: "Live" },
                ]}
              />
            </div>
          </div>

          {(standingsMode === "live" ? loadingStd : loadingSnap) ? (
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} height={33} />)}
            </div>
          ) : errorStd && standingsMode === "live" ? (
            <p className="empty-state">Couldn't load standings.</p>
          ) : (
            <div className="standings-table-scroll">
              <StandingsTable columns={EPL_STANDING_COLUMNS} groups={toEPLStandings(standings, mwStats, posChanges)} ranked teamLabel="Club" />
            </div>
          )}

          {standings.length > 0 && (
            <StandingsLegend items={[
              { tone: "primary", label: "Champions League" },
              { tone: "secondary", label: "Europa League" },
              { tone: "warning", label: "Conference League" },
              { tone: "danger", label: "Relegation" },
            ]} />
          )}
        </SportDashboardRail>
      </SportDashboardLayout>
    </PageContainer>
  );
}
