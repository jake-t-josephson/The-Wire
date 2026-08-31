import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import type { GameRowModel } from "../../models/sports";
import { GameRow } from "./GameRow";

const game: GameRowModel = {
  id: "game-1",
  href: "/epl/match/game-1",
  accessibleLabel: "Home FC vs Away FC",
  left: { team: { id: "home", name: "Home FC", shortName: "Home", abbreviation: "HOM" }, score: "2", winner: true },
  right: { team: { id: "away", name: "Away FC", shortName: "Away", abbreviation: "AWY" }, score: "1", winner: false },
  state: "final",
  statusLabel: "FT",
};

describe("GameRow", () => {
  it("renders a semantic game link without accessibility violations", async () => {
    const { container, getByRole } = render(<MemoryRouter><main><GameRow game={game} /></main></MemoryRouter>);
    expect(getByRole("link", { name: "Home FC vs Away FC" })).toHaveAttribute("href", "/epl/match/game-1");
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
