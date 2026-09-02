import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NFLGame } from "../../lib/nfl";
import type { NFLDashboardModel } from "../../features/nfl/useNFLDashboard";
import { NFLDashboardView } from "./NFLDashboard";

const game: NFLGame = {
  id: "game-1",
  date: "2026-09-01T19:00:00Z",
  name: "Away at Home",
  competitions: [{
    status: { displayClock: "", type: { state: "pre", completed: false, shortDetail: "7:00 PM" } },
    competitors: [
      { homeAway: "home", winner: null, score: "0", team: { id: "home", displayName: "Home Team", shortDisplayName: "Home", abbreviation: "HOM", logo: "", color: "" } },
      { homeAway: "away", winner: null, score: "0", team: { id: "away", displayName: "Away Team", shortDisplayName: "Away", abbreviation: "AWY", logo: "", color: "" } },
    ],
  }],
};

function model(overrides: Partial<NFLDashboardModel> = {}): NFLDashboardModel {
  return {
    activeConference: undefined,
    changeWeek: vi.fn(),
    conferenceTab: "AFC",
    dateRange: "Sep 1",
    games: [],
    gamesError: false,
    leagueLogo: null,
    liveCount: 0,
    loadingGames: false,
    loadingNews: false,
    loadingStandings: true,
    news: [],
    season: 2026,
    setConferenceTab: vi.fn(),
    setStandingsView: vi.fn(),
    standingsError: false,
    standingsView: "division",
    week: 1,
    ...overrides,
  } as NFLDashboardModel;
}

function renderPage(dashboard: NFLDashboardModel) {
  return render(<MemoryRouter><NFLDashboardView model={dashboard} /></MemoryRouter>);
}

describe("NFLDashboardView", () => {
  it("renders loading, error, and empty game states", () => {
    const { container, rerender } = renderPage(model({ loadingGames: true }));
    expect(container.querySelectorAll(".ui-skeleton").length).toBeGreaterThan(0);
    rerender(<MemoryRouter><NFLDashboardView model={model({ gamesError: true })} /></MemoryRouter>);
    expect(screen.getByText("Couldn't load games.")).toBeVisible();
    rerender(<MemoryRouter><NFLDashboardView model={model()} /></MemoryRouter>);
    expect(screen.getByText("No games scheduled this week.")).toBeVisible();
  });

  it("renders a game and delegates week navigation to the feature hook", async () => {
    const user = userEvent.setup();
    const changeWeek = vi.fn();
    renderPage(model({ games: [game], changeWeek }));
    expect(screen.getByText("AWY @ HOM")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next week" }));
    expect(changeWeek).toHaveBeenCalledWith(2);
  });
});
