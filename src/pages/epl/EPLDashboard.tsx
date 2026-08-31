import { useState, useEffect } from "react";
import {
  fetchFixtures, fetchStandings, fetchEPLNews,
  groupMatchweeks, currentMatchweekIndex, groupByDate,
  computeMatchweekStats, computePositionChanges,
  type Matchweek, type ESPNFixture, type ESPNStandingEntry, type EPLArticle,
} from "../../lib/espn";
import { fetchHistoricalFixtures, fetchHistoricalStandings } from "../../lib/supabase";
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

function matchweekDateRange(matchweek: Matchweek) {
  const format = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const start = format(matchweek.dates[0]);
  const end = matchweek.dates.length > 1 ? format(matchweek.dates[matchweek.dates.length - 1]) : null;
  return end ? `${start} – ${end}` : start;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EPLDashboard() {
  const [matchweeks,        setMatchweeks]        = useState<Matchweek[]>([]);
  const [mwIndex,           setMwIndex]           = useState<number | null>(null);
  const [liveMwIndex,       setLiveMwIndex]       = useState<number | null>(null);
  const [season,            setSeason]            = useState<number>(new Date().getFullYear());
  const [leagueLogo,        setLeagueLogo]        = useState<string | null>(null);
  const [fixtures,          setFixtures]          = useState<ESPNFixture[]>([]);
  const [liveStandings,     setLiveStandings]     = useState<ESPNStandingEntry[]>([]);
  const [snapshotStandings, setSnapshotStandings] = useState<ESPNStandingEntry[]>([]);
  const [standingsMode,     setStandingsMode]     = useState<"snapshot" | "live">("live");
  const [news,              setNews]              = useState<EPLArticle[]>([]);
  const [loadingFix,        setLoadingFix]        = useState(true);
  const [loadingStd,        setLoadingStd]        = useState(true);
  const [loadingSnap,       setLoadingSnap]       = useState(true);
  const [loadingNews,       setLoadingNews]       = useState(true);
  const [errorFix,          setErrorFix]          = useState(false);
  const [errorStd,          setErrorStd]          = useState(false);

  useEffect(() => {
    fetchFixtures()
      .then(({ calendar, season: yr, leagueLogo: logo }) => {
        const weeks = groupMatchweeks(calendar);
        const idx   = currentMatchweekIndex(weeks);
        setMatchweeks(weeks);
        setMwIndex(idx);
        setLiveMwIndex(idx);
        setSeason(yr);
        if (logo) setLeagueLogo(logo);
      })
      .catch(() => { setErrorFix(true); setLoadingFix(false); });

    fetchStandings()
      .then(setLiveStandings)
      .catch(() => setErrorStd(true))
      .finally(() => setLoadingStd(false));

    fetchEPLNews()
      .then(setNews)
      .finally(() => setLoadingNews(false));
  }, []);

  useEffect(() => {
    if (mwIndex === null || liveMwIndex === null || matchweeks.length === 0) return;
    const mw = matchweeks[mwIndex];
    const isHistorical = mwIndex < liveMwIndex;

    if (isHistorical) {
      fetchHistoricalFixtures(mw.number)
        .then((f) => {
          if (f.length > 0) return setFixtures(f);
          const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
          return fetchFixtures(p).then(({ fixtures }) => setFixtures(fixtures));
        })
        .catch(() => {
          const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
          return fetchFixtures(p).then(({ fixtures }) => setFixtures(fixtures));
        })
        .finally(() => setLoadingFix(false));
    } else {
      const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
      fetchFixtures(p)
        .then(({ fixtures }) => setFixtures(fixtures))
        .catch(() => setErrorFix(true))
        .finally(() => setLoadingFix(false));
    }

    fetchHistoricalStandings(mw.number, season)
      .then(setSnapshotStandings)
      .catch(() => setSnapshotStandings([]))
      .finally(() => setLoadingSnap(false));
  }, [mwIndex, liveMwIndex, matchweeks, season]);

  const standings  = standingsMode === "live" ? liveStandings : snapshotStandings;
  const liveCount  = fixtures.filter((f) => f.competitions[0].status.type.state === "in").length;
  const days       = groupByDate(fixtures);
  const mwStats    = standingsMode === "live" ? computeMatchweekStats(fixtures) : new Map();
  const posChanges = standingsMode === "live" ? computePositionChanges(standings, mwStats) : new Map<string, number>();
  const currentMw  = mwIndex !== null ? matchweeks[mwIndex] : null;

  const changeMatchweek = (nextIndex: number) => {
    setLoadingFix(true);
    setLoadingSnap(true);
    setErrorFix(false);
    setSnapshotStandings([]);
    setStandingsMode(liveMwIndex !== null && nextIndex < liveMwIndex ? "snapshot" : "live");
    setMwIndex(nextIndex);
  };

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
              label={matchweeks[mwIndex]?.label ?? "Matchweek"}
              detail={matchweeks[mwIndex] ? matchweekDateRange(matchweeks[mwIndex]) : undefined}
              previousLabel="Previous matchweek"
              nextLabel="Next matchweek"
              onPrevious={() => changeMatchweek(Math.max(0, mwIndex - 1))}
              onNext={() => changeMatchweek(Math.min(matchweeks.length - 1, mwIndex + 1))}
              previousDisabled={mwIndex === 0}
              nextDisabled={mwIndex === matchweeks.length - 1}
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
                  { value: "snapshot", label: currentMw?.label ?? "GW", disabled: snapshotStandings.length === 0 },
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
