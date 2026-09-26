import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cfbWeekDateRange,
  fetchCFBNews,
  fetchCFBPollSnapshot,
  fetchCFBRankings,
  fetchCFBScoreboard,
  groupCFBByDate,
  type CFBConferenceKey,
  type CFBArticle,
  type CFBGame,
  type CFBRankingEntry,
  CFB_CONFERENCES,
} from "../../lib/cfb";

export type CFBRankingsMode = "live" | "snapshot";

export type CFBView = "sec" | "big10" | "top25";

const VIEW_TO_CONF: Record<CFBView, CFBConferenceKey | null> = {
  sec:   "SEC",
  big10: "Big10",
  top25: null,
};

export function useCFBDashboard() {
  const [week, setWeek] = useState(1);
  const [season, setSeason] = useState(new Date().getFullYear());
  const [view, setView] = useState<CFBView>("sec");
  const [rankingsMode, setRankingsMode] = useState<CFBRankingsMode>("live");
  const [games, setGames] = useState<CFBGame[]>([]);
  const [liveRankings, setLiveRankings] = useState<CFBRankingEntry[]>([]);
  const [snapshotRankings, setSnapshotRankings] = useState<CFBRankingEntry[]>([]);
  const [news, setNews] = useState<CFBArticle[]>([]);
  const [leagueLogo, setLeagueLogo] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [gamesError, setGamesError] = useState(false);
  const scoreboardRequest = useRef(0);

  const loadRankings = useCallback((nextWeek: number, nextSeason: number) => {
    setLoadingRankings(true);
    fetchCFBRankings()
      .then(setLiveRankings)
      .catch(() => {})
      .finally(() => setLoadingRankings(false));
    fetchCFBPollSnapshot(nextSeason, nextWeek)
      .then(setSnapshotRankings)
      .catch(() => {});
  }, []);

  const loadGames = useCallback((nextWeek: number, nextView: CFBView) => {
    const request = ++scoreboardRequest.current;
    setLoadingGames(true);
    setGamesError(false);
    const conf = VIEW_TO_CONF[nextView];
    fetchCFBScoreboard(nextWeek, conf ? CFB_CONFERENCES[conf] : undefined)
      .then(({ week: w, season: s, games: g, leagueLogo: logo }) => {
        if (request !== scoreboardRequest.current) return;
        setWeek(w);
        setSeason(s);
        setGames(g);
        if (logo) setLeagueLogo(logo);
      })
      .catch(() => { if (request === scoreboardRequest.current) setGamesError(true); })
      .finally(() => { if (request === scoreboardRequest.current) setLoadingGames(false); });
  }, []);

  // Initial load — scoreboard resolves the true current week, then fetch matching rankings
  useEffect(() => {
    const request = ++scoreboardRequest.current;
    setLoadingGames(true);
    const conf = VIEW_TO_CONF[view];
    fetchCFBScoreboard(undefined, conf ? CFB_CONFERENCES[conf] : undefined)
      .then(({ week: w, season: s, games: g, leagueLogo: logo }) => {
        if (request !== scoreboardRequest.current) return;
        setWeek(w);
        setSeason(s);
        setGames(g);
        if (logo) setLeagueLogo(logo);
        loadRankings(w, s);
      })
      .catch(() => { if (request === scoreboardRequest.current) setGamesError(true); })
      .finally(() => { if (request === scoreboardRequest.current) setLoadingGames(false); });

    fetchCFBNews()
      .then(setNews)
      .finally(() => setLoadingNews(false));

    return () => { scoreboardRequest.current += 1; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeWeek = useCallback((nextWeek: number) => {
    setWeek(nextWeek);
    loadGames(nextWeek, view);
    loadRankings(nextWeek, season);
  }, [view, season, loadGames, loadRankings]);

  const changeView = useCallback((nextView: CFBView) => {
    setView(nextView);
    loadGames(week, nextView);
  }, [week, loadGames]);

  const liveCount = useMemo(
    () => games.filter((g) => g.competitions[0].status.type.state === "in").length,
    [games],
  );

  const days = useMemo(() => groupCFBByDate(games), [games]);
  const dateRange = useMemo(() => cfbWeekDateRange(games), [games]);
  const rankings = rankingsMode === "live" ? liveRankings : snapshotRankings;

  return {
    changeView,
    changeWeek,
    dateRange,
    days,
    games,
    gamesError,
    leagueLogo,
    liveCount,
    loadingGames,
    loadingNews,
    loadingRankings,
    news,
    rankings,
    rankingsMode,
    season,
    setRankingsMode,
    view,
    week,
  };
}

export type CFBDashboardModel = ReturnType<typeof useCFBDashboard>;
