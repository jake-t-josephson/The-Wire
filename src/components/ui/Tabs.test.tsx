import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

function ExampleTabs() {
  const [value, setValue] = useState("fixtures");
  return (
    <>
      <Tabs
        label="League sections"
        value={value}
        onChange={setValue}
        panelId="league-panel"
        items={[
          { label: "Fixtures", value: "fixtures" },
          { label: "Disabled", value: "disabled", disabled: true },
          { label: "Table", value: "table" },
        ]}
      />
      <div id="league-panel" role="tabpanel">{value}</div>
    </>
  );
}

describe("Tabs", () => {
  it("moves selection with arrow keys and skips disabled tabs", async () => {
    const user = userEvent.setup();
    render(<ExampleTabs />);
    const fixtures = screen.getByRole("tab", { name: "Fixtures" });
    fixtures.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Table" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Table" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("table");
  });

  it("supports Home and End navigation", async () => {
    const user = userEvent.setup();
    render(<ExampleTabs />);
    screen.getByRole("tab", { name: "Fixtures" }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Table" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Fixtures" })).toHaveFocus();
  });
});
