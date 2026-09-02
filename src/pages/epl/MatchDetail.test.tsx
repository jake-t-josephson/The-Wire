import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ESPNMatchSummary } from "../../lib/espn";
import { MatchContent } from "./MatchDetail";

describe("MatchContent", () => {
  it("exposes possession and comparison bars as native progress values", () => {
    const summary: ESPNMatchSummary = {
      homeTeam: { id: "home", displayName: "Home FC", shortDisplayName: "Home", logo: "", color: "", score: "2" },
      awayTeam: { id: "away", displayName: "Away FC", shortDisplayName: "Away", logo: "", color: "", score: "1" },
      status: { state: "post", detail: "Full Time", clock: "90'", completed: true },
      date: "2026-09-01T19:00:00Z",
      homeStats: [{ name: "possessionPct", displayValue: "60" }, { name: "totalShots", displayValue: "12" }],
      awayStats: [{ name: "possessionPct", displayValue: "40" }, { name: "totalShots", displayValue: "8" }],
    };
    render(<MatchContent summary={summary} />);
    expect(screen.getByRole("progressbar", { name: "Home possession 60%, away possession 40%" })).toHaveValue(60);
    expect(screen.getByRole("progressbar", { name: "Shots, home 12" })).toHaveValue(60);
    expect(screen.getByRole("progressbar", { name: "Shots, away 8" })).toHaveValue(40);
  });
});
