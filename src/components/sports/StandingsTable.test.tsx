import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import type { StandingColumnModel, StandingGroupModel } from "../../models/sports";
import { StandingsTable } from "./StandingsTable";

const columns: StandingColumnModel[] = [{ key: "points", label: "Pts", width: "2rem", align: "right", emphasis: true }];
const groups: StandingGroupModel[] = [{
  id: "league",
  rows: [{
    id: "team-1",
    href: "/epl/team/team-1",
    rank: 1,
    team: { id: "team-1", name: "The Wire FC", shortName: "Wire", abbreviation: "WIR" },
    cells: { points: { value: "12", detail: "+3", detailTone: "positive" } },
    zone: "primary",
  }],
}];

describe("StandingsTable", () => {
  it("renders normalized standings as navigable rows without accessibility violations", async () => {
    const { container, getByRole } = render(<MemoryRouter><main><StandingsTable columns={columns} groups={groups} ranked /></main></MemoryRouter>);
    expect(getByRole("link")).toHaveAttribute("href", "/epl/team/team-1");
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
