import { useState, type ReactNode } from "react";
import { PageContainer, PageHeader } from "../components/layout/Page";
import { StatusDot } from "../components/sports/StatusDot";
import { TeamCrest } from "../components/sports/TeamCrest";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { LinkButton } from "../components/ui/LinkButton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { Panel } from "../components/ui/Panel";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { Eyebrow, SectionLabel } from "../components/ui/Typography";
import { PeriodNavigator } from "../components/sports/PeriodNavigator";
import { NewsFeed } from "../components/sports/NewsFeed";
import { GameRow } from "../components/sports/GameRow";
import { StandingsTable } from "../components/sports/StandingsTable";
import { EPL_SOURCE_META } from "../lib/sourceMeta";
import type { GameRowModel, StandingColumnModel, StandingGroupModel } from "../models/sports";

const EXAMPLE_GAME: GameRowModel = {
  id: "example-game",
  accessibleLabel: "The Wire FC vs Athletic Press",
  left: { team: { id: "wire", name: "The Wire FC", shortName: "The Wire", abbreviation: "WIR" }, score: "2", winner: true },
  right: { team: { id: "press", name: "Athletic Press", shortName: "Athletic", abbreviation: "ATH" }, score: "1" },
  state: "live",
  statusLabel: "88'",
  wire: true,
};

const EXAMPLE_COLUMNS: StandingColumnModel[] = [{ key: "points", label: "Pts", width: "2rem", align: "right", emphasis: true }];
const EXAMPLE_STANDINGS: StandingGroupModel[] = [{
  id: "example-table",
  rows: [{ id: "wire", rank: 1, team: EXAMPLE_GAME.left.team, cells: { points: { value: "24", detail: "+3", detailTone: "positive" } }, zone: "primary" }],
}];

export default function StyleGuide() {
  const [tab, setTab] = useState<"fixtures" | "table">("fixtures");

  return (
    <PageContainer className="pb-16">
      <PageHeader eyebrow={<Eyebrow signal className="mb-2.5 block">Internal</Eyebrow>} title="UI Foundations" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Showcase title="Buttons">
          <Button variant="primary">Primary</Button><Button>Secondary</Button><Button variant="ghost">Ghost</Button><Button loading>Loading</Button><Button disabled>Disabled</Button><IconButton aria-label="Previous">‹</IconButton><LinkButton to="/">Link</LinkButton>
        </Showcase>
        <Showcase title="Controls">
          <SegmentedControl label="Example view" value="live" onChange={() => undefined} items={[{ label: "Week 4", value: "week" }, { label: "Live", value: "live" }]} />
          <Select defaultValue="football" aria-label="Sport"><option value="football">Football</option><option value="basketball">Basketball</option></Select>
        </Showcase>
        <Showcase title="Status and badges">
          <span className="label-caps flex items-center gap-2 text-signal"><StatusDot /> Live</span>
          <span className="label-caps flex items-center gap-2 text-signal"><StatusDot state="wire" /> Down to the wire</span>
          <span className="label-caps flex items-center gap-2 text-muted"><StatusDot state="final" /> Final</span>
          <Badge>ESPN</Badge>
        </Showcase>
        <Showcase title="Content">
          <TeamCrest name="The Wire FC" abbreviation="TWF" />
          <div className="w-40 space-y-2"><Skeleton height={14} /><Skeleton width="70%" height={10} /></div>
        </Showcase>
        <Showcase title="Sports navigation">
          <PeriodNavigator label="GW 4" detail="Sep 12 – Sep 14" previousLabel="Previous matchweek" nextLabel="Next matchweek" onPrevious={() => undefined} onNext={() => undefined} />
        </Showcase>
      </div>
      <div className="mt-6">
        <Tabs label="Example sections" panelId="ui-example-panel" value={tab} onChange={setTab} items={[{ label: "Fixtures", value: "fixtures" }, { label: "Table", value: "table" }]} />
        <Panel id="ui-example-panel" role="tabpanel" aria-label={tab} className="rounded-t-none p-5">
          {tab === "fixtures" ? <EmptyState>No fixtures in this example.</EmptyState> : <ErrorState>Table data is unavailable.</ErrorState>}
        </Panel>
      </div>
      <Panel className="mt-6 p-5">
        <SectionLabel className="mb-5">News feed</SectionLabel>
        <NewsFeed
          sources={EPL_SOURCE_META}
          pageSize={2}
          articles={[
            { source: "ESPN", headline: "A shared sports headline", description: "Article rows and source filters now render through one component.", published: new Date().toISOString(), url: "#" },
            { source: "The Guardian", headline: "A second source on the wire", published: new Date().toISOString(), url: "#" },
          ]}
        />
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel className="min-w-0 p-5">
          <SectionLabel className="mb-5">Shared game row</SectionLabel>
          <GameRow game={EXAMPLE_GAME} />
        </Panel>
        <Panel className="min-w-0 p-5">
          <SectionLabel className="mb-5">Shared standings</SectionLabel>
          <div className="standings-table-scroll"><StandingsTable columns={EXAMPLE_COLUMNS} groups={EXAMPLE_STANDINGS} ranked /></div>
        </Panel>
      </div>
    </PageContainer>
  );
}

function Showcase({ title, children }: { title: string; children: ReactNode }) {
  return <Panel className="p-5"><SectionLabel className="mb-5">{title}</SectionLabel><div className="flex flex-wrap items-center gap-3">{children}</div></Panel>;
}
