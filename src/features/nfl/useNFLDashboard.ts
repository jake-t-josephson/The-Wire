import { useCallback, useEffect, useState } from "react";
import {
  fetchNFLNews,
  fetchNFLScoreboard,
  fetchNFLStandings,
  weekDateRange,
  type NFLArticle,
  type NFLConference,
  type NFLGame,
} from "../../lib/nfl";

export type NFLStandingsView = "division" | "conference";
export type NFLConferenceTab = "AFC" | "NFC";

export function useNFLDashboard() {
  const [week, setWeek] = useState(1);
  const [season, setSeason] = useState(new Date().getFullYear());
  const [games, setGames] = useState<NFLGame[]>([]);
  const [dateRange, setDateRange] = useState("");
  const [leagueLogo, setLeagueLogo] = useState<string | null>(null);
  const [conferences, setConferences] = useState<NFLConference[]>([]);
  const [standingsView, setStandingsView] = useState<NFLStandingsView>("division");
  const [conferenceTab, setConferenceTab] = useState<NFLConferenceTab>("AFC");
  const [news, setNews] = useState<NFLArticle[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [gamesError, setGamesError] = useState(false);
  const [standingsError, setStandingsError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchNFLScoreboard()
      .then(({ week: nextWeek, season: nextSeason, games: nextGames, leagueLogo: nextLogo }) => {
        if (!active) return;
        setWeek(nextWeek);
        setSeason(nextSeason);
        setGames(nextGames);
        setDateRange(weekDateRange(nextGames));
        if (nextLogo) setLeagueLogo(nextLogo);
      })
      .catch(() => { if (active) setGamesError(true); })
      .finally(() => { if (active) setLoadingGames(false); });

    fetchNFLStandings()
      .then((entries) => { if (active) setConferences(entries); })
      .catch(() => { if (active) setStandingsError(true); })
      .finally(() => { if (active) setLoadingStandings(false); });

    fetchNFLNews()
      .then((articles) => { if (active) setNews(articles); })
      .finally(() => { if (active) setLoadingNews(false); });

    return () => { active = false; };
  }, []);

  const changeWeek = useCallback((nextWeek: number) => {
    setLoadingGames(true);
    setGamesError(false);
    setWeek(nextWeek);
    fetchNFLScoreboard(nextWeek)
      .then(({ season: nextSeason, games: nextGames }) => {
        setSeason(nextSeason);
        setGames(nextGames);
        setDateRange(weekDateRange(nextGames));
      })
      .catch(() => setGamesError(true))
      .finally(() => setLoadingGames(false));
  }, []);

  return {
    activeConference: conferences.find((conference) => conference.shortName === conferenceTab),
    changeWeek,
    conferenceTab,
    dateRange,
    games,
    gamesError,
    leagueLogo,
    liveCount: games.filter((game) => game.competitions[0].status.type.state === "in").length,
    loadingGames,
    loadingNews,
    loadingStandings,
    news,
    season,
    setConferenceTab,
    setStandingsView,
    standingsError,
    standingsView,
    week,
  };
}

export type NFLDashboardModel = ReturnType<typeof useNFLDashboard>;
