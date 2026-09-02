import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeMatchweekStats,
  computePositionChanges,
  currentMatchweekIndex,
  fetchEPLNews,
  fetchFixtures,
  fetchStandings,
  groupByDate,
  groupMatchweeks,
  type EPLArticle,
  type ESPNFixture,
  type ESPNStandingEntry,
  type Matchweek,
} from "../../lib/espn";
import { fetchHistoricalFixtures, fetchHistoricalStandings } from "../../lib/supabase";

export type EPLStandingsMode = "snapshot" | "live";

export function useEPLDashboard() {
  const [matchweeks, setMatchweeks] = useState<Matchweek[]>([]);
  const [matchweekIndex, setMatchweekIndex] = useState<number | null>(null);
  const [liveMatchweekIndex, setLiveMatchweekIndex] = useState<number | null>(null);
  const [season, setSeason] = useState(new Date().getFullYear());
  const [leagueLogo, setLeagueLogo] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState<ESPNFixture[]>([]);
  const [liveStandings, setLiveStandings] = useState<ESPNStandingEntry[]>([]);
  const [snapshotStandings, setSnapshotStandings] = useState<ESPNStandingEntry[]>([]);
  const [standingsMode, setStandingsMode] = useState<EPLStandingsMode>("live");
  const [news, setNews] = useState<EPLArticle[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [fixturesError, setFixturesError] = useState(false);
  const [standingsError, setStandingsError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchFixtures()
      .then(({ calendar, season: nextSeason, leagueLogo: nextLogo }) => {
        if (!active) return;
        const nextMatchweeks = groupMatchweeks(calendar);
        const nextIndex = nextMatchweeks.length > 0 ? currentMatchweekIndex(nextMatchweeks) : null;
        setMatchweeks(nextMatchweeks);
        setMatchweekIndex(nextIndex);
        setLiveMatchweekIndex(nextIndex);
        setSeason(nextSeason);
        if (nextLogo) setLeagueLogo(nextLogo);
        if (nextIndex === null) setLoadingFixtures(false);
      })
      .catch(() => {
        if (!active) return;
        setFixturesError(true);
        setLoadingFixtures(false);
      });

    fetchStandings()
      .then((entries) => { if (active) setLiveStandings(entries); })
      .catch(() => { if (active) setStandingsError(true); })
      .finally(() => { if (active) setLoadingStandings(false); });

    fetchEPLNews()
      .then((articles) => { if (active) setNews(articles); })
      .finally(() => { if (active) setLoadingNews(false); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (matchweekIndex === null || liveMatchweekIndex === null) return;
    const matchweek = matchweeks[matchweekIndex];
    if (!matchweek) return;
    let active = true;
    const period = matchweek.start === matchweek.end ? matchweek.start : `${matchweek.start}-${matchweek.end}`;
    const historical = matchweekIndex < liveMatchweekIndex;

    const loadFixtures = historical
      ? fetchHistoricalFixtures(matchweek.number)
          .then((entries) => entries.length > 0 ? entries : fetchFixtures(period).then((result) => result.fixtures))
          .catch(() => fetchFixtures(period).then((result) => result.fixtures))
      : fetchFixtures(period).then((result) => result.fixtures);

    loadFixtures
      .then((entries) => { if (active) setFixtures(entries); })
      .catch(() => { if (active) setFixturesError(true); })
      .finally(() => { if (active) setLoadingFixtures(false); });

    fetchHistoricalStandings(matchweek.number, season)
      .then((entries) => { if (active) setSnapshotStandings(entries); })
      .catch(() => { if (active) setSnapshotStandings([]); })
      .finally(() => { if (active) setLoadingSnapshot(false); });

    return () => { active = false; };
  }, [liveMatchweekIndex, matchweekIndex, matchweeks, season]);

  const changeMatchweek = useCallback((nextIndex: number) => {
    setLoadingFixtures(true);
    setLoadingSnapshot(true);
    setFixturesError(false);
    setSnapshotStandings([]);
    setStandingsMode(liveMatchweekIndex !== null && nextIndex < liveMatchweekIndex ? "snapshot" : "live");
    setMatchweekIndex(nextIndex);
  }, [liveMatchweekIndex]);

  const standings = standingsMode === "live" ? liveStandings : snapshotStandings;
  const matchweekStats = useMemo(
    () => standingsMode === "live" ? computeMatchweekStats(fixtures) : new Map(),
    [fixtures, standingsMode],
  );
  const positionChanges = useMemo(
    () => standingsMode === "live" ? computePositionChanges(standings, matchweekStats) : new Map<string, number>(),
    [matchweekStats, standings, standingsMode],
  );
  const liveCount = useMemo(
    () => fixtures.filter((fixture) => fixture.competitions[0].status.type.state === "in").length,
    [fixtures],
  );

  return {
    changeMatchweek,
    currentMatchweek: matchweekIndex === null ? null : matchweeks[matchweekIndex] ?? null,
    days: groupByDate(fixtures),
    fixtures,
    fixturesError,
    leagueLogo,
    liveCount,
    loadingFixtures,
    loadingNews,
    loadingSnapshot,
    loadingStandings,
    matchweekIndex,
    matchweeks,
    matchweekStats,
    news,
    positionChanges,
    setStandingsMode,
    snapshotStandings,
    standings,
    standingsError,
    standingsMode,
  };
}

export type EPLDashboardModel = ReturnType<typeof useEPLDashboard>;
