import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NFLGame } from "../../lib/nfl";

const mocks = vi.hoisted(() => ({
  fetchNews: vi.fn(),
  fetchScoreboard: vi.fn(),
  fetchStandings: vi.fn(),
}));

vi.mock("../../lib/nfl", async () => ({
  ...(await vi.importActual<typeof import("../../lib/nfl")>("../../lib/nfl")),
  fetchNFLNews: mocks.fetchNews,
  fetchNFLScoreboard: mocks.fetchScoreboard,
  fetchNFLStandings: mocks.fetchStandings,
}));

import { useNFLDashboard } from "./useNFLDashboard";

function game(id: string): NFLGame {
  return {
    id,
    date: "2026-09-01T19:00:00Z",
    name: id,
    competitions: [{
      status: { displayClock: "", type: { state: "pre", completed: false, shortDetail: "7:00 PM" } },
      competitors: [
        { homeAway: "home", winner: null, score: "0", team: { id: "home", displayName: "Home", shortDisplayName: "Home", abbreviation: "HOM", logo: "", color: "" } },
        { homeAway: "away", winner: null, score: "0", team: { id: "away", displayName: "Away", shortDisplayName: "Away", abbreviation: "AWY", logo: "", color: "" } },
      ],
    }],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

describe("useNFLDashboard", () => {
  beforeEach(() => {
    mocks.fetchNews.mockReset().mockResolvedValue([]);
    mocks.fetchStandings.mockReset().mockResolvedValue([]);
    mocks.fetchScoreboard.mockReset().mockResolvedValue({ week: 1, season: 2026, games: [game("week-1")], leagueLogo: null });
  });

  it("ignores stale week responses that resolve out of order", async () => {
    const { result } = renderHook(() => useNFLDashboard());
    await waitFor(() => expect(result.current.loadingGames).toBe(false));

    const weekTwo = deferred<{ week: number; season: number; games: NFLGame[]; leagueLogo: null }>();
    const weekThree = deferred<{ week: number; season: number; games: NFLGame[]; leagueLogo: null }>();
    mocks.fetchScoreboard
      .mockImplementationOnce(() => weekTwo.promise)
      .mockImplementationOnce(() => weekThree.promise);

    act(() => result.current.changeWeek(2));
    act(() => result.current.changeWeek(3));

    await act(async () => weekThree.resolve({ week: 3, season: 2026, games: [game("week-3")], leagueLogo: null }));
    await waitFor(() => expect(result.current.games[0]?.id).toBe("week-3"));

    await act(async () => weekTwo.resolve({ week: 2, season: 2026, games: [game("week-2")], leagueLogo: null }));
    expect(result.current.week).toBe(3);
    expect(result.current.games[0]?.id).toBe("week-3");
    expect(result.current.loadingGames).toBe(false);
  });
});
