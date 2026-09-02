import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ESPNFixture } from "../../lib/espn";
import type { EPLDashboardModel } from "../../features/epl/useEPLDashboard";
import { EPLDashboardView } from "./EPLDashboard";

const fixture: ESPNFixture = {
  id: "match-1",
  date: "2026-09-01T19:00:00Z",
  name: "Wire FC vs Press Athletic",
  competitions: [{
    status: { displayClock: "", type: { state: "pre", completed: false, shortDetail: "7:00 PM" } },
    competitors: [
      { homeAway: "home", winner: false, score: "0", team: { id: "wire", displayName: "Wire FC", shortDisplayName: "Wire", abbreviation: "WIR", color: "", alternateColor: "", logo: "" } },
      { homeAway: "away", winner: false, score: "0", team: { id: "press", displayName: "Press Athletic", shortDisplayName: "Press", abbreviation: "PRS", color: "", alternateColor: "", logo: "" } },
    ],
  }],
};

function model(overrides: Partial<EPLDashboardModel> = {}): EPLDashboardModel {
  return {
    changeMatchweek: vi.fn(),
    currentMatchweek: null,
    days: [],
    fixtures: [],
    fixturesError: false,
    leagueLogo: null,
    liveCount: 0,
    loadingFixtures: false,
    loadingNews: false,
    loadingSnapshot: false,
    loadingStandings: true,
    matchweekIndex: null,
    matchweeks: [],
    matchweekStats: new Map(),
    news: [],
    positionChanges: new Map(),
    setStandingsMode: vi.fn(),
    snapshotStandings: [],
    standings: [],
    standingsError: false,
    standingsMode: "live",
    ...overrides,
  } as EPLDashboardModel;
}

function renderPage(dashboard: EPLDashboardModel) {
  return render(<MemoryRouter><EPLDashboardView model={dashboard} /></MemoryRouter>);
}

describe("EPLDashboardView", () => {
  it("renders loading, error, and empty fixture states", () => {
    const { container, rerender } = renderPage(model({ loadingFixtures: true }));
    expect(container.querySelectorAll(".ui-skeleton").length).toBeGreaterThan(0);
    rerender(<MemoryRouter><EPLDashboardView model={model({ fixturesError: true })} /></MemoryRouter>);
    expect(screen.getByText("Couldn't load fixtures.")).toBeVisible();
    rerender(<MemoryRouter><EPLDashboardView model={model()} /></MemoryRouter>);
    expect(screen.getByText("No fixtures this gameweek.")).toBeVisible();
  });

  it("renders normalized games and transitions to the match route", async () => {
    const user = userEvent.setup();
    const success = model({ fixtures: [fixture], days: [{ label: "Tuesday", fixtures: [fixture] }] });
    render(
      <MemoryRouter initialEntries={["/epl"]}>
        <Routes>
          <Route path="/epl" element={<EPLDashboardView model={success} />} />
          <Route path="/epl/match/:eventId" element={<p>Match route reached</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("link", { name: "Wire FC vs Press Athletic" }));
    expect(screen.getByText("Match route reached")).toBeVisible();
  });
});
