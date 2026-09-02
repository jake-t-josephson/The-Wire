import { describe, expect, it } from "vitest";
import type { ESPNFixture, ESPNStandingEntry } from "../espn";
import { toCompactGame, toCompactStanding } from "./home";

describe("Home adapters", () => {
  it("normalizes provider games for any compact league surface", () => {
    const fixture = {
      id: "1",
      date: "2026-09-01T19:00:00Z",
      competitions: [{
        status: { displayClock: "89'", type: { state: "in", completed: false, shortDetail: "89'" } },
        competitors: [
          { homeAway: "home", winner: false, score: "1", team: { id: "h", displayName: "Home", shortDisplayName: "Home", abbreviation: "HOM", logo: "" } },
          { homeAway: "away", winner: true, score: "2", team: { id: "a", displayName: "Away", shortDisplayName: "Away", abbreviation: "AWY", logo: "" } },
        ],
      }],
    } as ESPNFixture;
    expect(toCompactGame(fixture, { leagueLabel: "NFL", routeBase: "/nfl/game" })).toMatchObject({
      href: "/nfl/game/1",
      leagueLabel: "NFL",
      state: "live",
      statusLabel: "89'",
      wire: true,
    });
  });

  it("normalizes compact standings without leaking provider stats", () => {
    const entry = {
      team: { id: "wire", displayName: "Wire FC", shortDisplayName: "Wire", abbreviation: "WIR", logos: [] },
      stats: [
        { name: "rank", displayValue: "2", value: 2 },
        { name: "pointDifferential", displayValue: "+4", value: 4 },
        { name: "points", displayValue: "12", value: 12 },
      ],
    } as ESPNStandingEntry;
    expect(toCompactStanding(entry, 0, "/epl/team")).toEqual({ id: "wire", href: "/epl/team/wire", position: 2, teamName: "Wire", goalDifference: "+4", points: "12" });
  });
});
