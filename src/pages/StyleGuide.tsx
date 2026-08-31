import { PageContainer, PageHeader } from "../components/layout/Page";
import { StatusDot } from "../components/sports/StatusDot";
import { TeamCrest } from "../components/sports/TeamCrest";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { Eyebrow, SectionLabel } from "../components/ui/Typography";

export default function StyleGuide() {
  return (
    <PageContainer className="pb-16">
      <PageHeader eyebrow={<Eyebrow signal className="mb-2.5 block">Internal</Eyebrow>} title="UI Foundations" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Showcase title="Buttons">
          <Button variant="primary">Primary</Button><Button>Secondary</Button><Button variant="ghost">Ghost</Button><Button disabled>Disabled</Button>
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
      </div>
      <div className="mt-6"><Tabs label="Example sections" value="fixtures" items={[{ label: "Fixtures", value: "fixtures" }, { label: "Table", value: "table" }, { label: "Wireroom", value: "wireroom", disabled: true }]} /></div>
    </PageContainer>
  );
}

function Showcase({ title, children }: { title: string; children: ReactNode }) {
  return <Panel className="p-5"><SectionLabel className="mb-5">{title}</SectionLabel><div className="flex flex-wrap items-center gap-3">{children}</div></Panel>;
}
import type { ReactNode } from "react";
