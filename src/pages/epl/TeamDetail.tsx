import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { fetchTeam, fetchTeamFixtures, type TeamInfo, type TeamFixture } from "../../lib/supabase";
import { fetchStandings, fetchFixtures, type ESPNStandingEntry } from "../../lib/espn";
import { PageContainer } from "../../components/layout/Page";
import { TeamCrest } from "../../components/sports/TeamCrest";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Panel } from "../../components/ui/Panel";
import { Skeleton } from "../../components/ui/Skeleton";
import { SectionLabel } from "../../components/ui/Typography";

// ── Helpers ───────────────────────────────────────────────────────────────────

function resultFor(f: TeamFixture): "W" | "D" | "L" | null {
  if (f.teamScore === null || f.oppScore === null) return null;
  if (f.teamScore > f.oppScore) return "W";
  if (f.teamScore < f.oppScore) return "L";
  return "D";
}

function resultColor(r: "W" | "D" | "L") {
  return r === "W" ? "bg-up text-ink" : r === "D" ? "bg-amber text-ink" : "bg-down text-bone";
}

function statVal(entry: ESPNStandingEntry, name: string): number {
  return entry.stats.find((s) => s.name === name)?.value ?? 0;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate   = useNavigate();

  const [team,     setTeam]     = useState<TeamInfo | null>(null);
  const [fixtures, setFixtures] = useState<TeamFixture[]>([]);
  const [standing, setStanding] = useState<ESPNStandingEntry | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    if (!teamId) return;
    const apiId = parseInt(teamId, 10);

    Promise.all([
      fetchTeam(apiId),
      fetchFixtures().then(({ season: yr }) => yr),
      fetchStandings(),
    ])
      .then(async ([teamInfo, yr, standingsEntries]) => {
        if (!teamInfo) { setError(true); return; }
        setTeam(teamInfo);
        const stand = standingsEntries.find((e) => e.team.id === teamId) ?? null;
        setStanding(stand);
        const teamFixtures = await fetchTeamFixtures(teamInfo.dbId, yr);
        setFixtures(teamFixtures);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [teamId]);

  const played   = fixtures.filter((f) => f.status === "finished");
  const form     = played.slice(-5);
  const upcoming = fixtures.filter((f) => f.status !== "finished");

  return (
    <PageContainer className="max-w-3xl py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/epl")}
        className="group mb-6 px-0"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">‹</span>
        Premier League
      </Button>

      {loading ? (
        <TeamSkeleton />
      ) : error || !team ? (
        <p className="text-sm text-muted text-center py-16">Couldn't load team.</p>
      ) : (
        <TeamContent
          team={team}
          standing={standing}
          form={form}
          played={played}
          upcoming={upcoming}
          navigate={navigate}
        />
      )}
    </PageContainer>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Panel>
      <Panel className="space-y-3 p-5">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </Panel>
    </div>
  );
}

function TeamContent({
  team, standing, form, played, upcoming, navigate,
}: {
  team: TeamInfo;
  standing: ESPNStandingEntry | null;
  form: TeamFixture[];
  played: TeamFixture[];
  upcoming: TeamFixture[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const pos  = standing ? statVal(standing, "rank") : null;
  const pts  = standing ? statVal(standing, "points") : null;
  const mp   = standing ? statVal(standing, "gamesPlayed") : null;
  const w    = standing ? statVal(standing, "wins") : null;
  const d    = standing ? statVal(standing, "ties") : null;
  const l    = standing ? statVal(standing, "losses") : null;
  const gd   = standing ? statVal(standing, "pointDifferential") : null;
  const gf   = standing ? statVal(standing, "pointsFor") : null;
  const ga   = standing ? statVal(standing, "pointsAgainst") : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <Panel className="p-6">
        <div className="flex items-center gap-5">
          <TeamCrest src={team.crestUrl} name={team.name} size={72} />
          <div>
            <h1 className="text-2xl font-semibold text-bone leading-tight">{team.name}</h1>
            {pos !== null && (
              <p className="text-sm text-muted mt-1">
                {ordinal(pos)} place · {pts} pts
              </p>
            )}
          </div>
        </div>

        {standing && (
          <div className="mt-5 pt-4 border-t border-hairline grid grid-cols-6 gap-1 text-center">
            {[
              ["MP", mp], ["W", w], ["D", d], ["L", l],
              ["GD", gd !== null && gd >= 0 ? `+${gd}` : gd], ["GF/GA", gf !== null ? `${gf}/${ga}` : "–"],
            ].map(([label, val]) => (
              <div key={String(label)}>
                <p className="label-caps text-muted">{label}</p>
                <p className="text-sm font-semibold text-bone mt-0.5">{val ?? "–"}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Form */}
      {form.length > 0 && (
        <Panel className="p-5">
          <SectionLabel className="mb-3">Last {form.length}</SectionLabel>
          <div className="flex items-center gap-2">
            {form.map((f) => {
              const r = resultFor(f);
              if (!r) return null;
              return (
                <IconButton
                  key={f.apiId}
                  onClick={() => navigate(`/epl/match/${f.apiId}`)}
                  title={`GW${f.matchweek} vs ${f.opponent.shortName} ${f.teamScore}–${f.oppScore}`}
                  aria-label={`Matchweek ${f.matchweek}, ${r}`}
                  className={`h-8 min-h-8 w-8 ${resultColor(r)}`}
                >
                  {r}
                </IconButton>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Results */}
      {played.length > 0 && (
        <FixtureTable
          title="Results"
          fixtures={[...played].reverse()}
        />
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <FixtureTable
          title="Upcoming"
          fixtures={upcoming}
        />
      )}
    </div>
  );
}

function FixtureTable({
  title, fixtures,
}: {
  title: string;
  fixtures: TeamFixture[];
}) {
  return (
    <Panel className="p-5">
      <SectionLabel className="mb-3">{title}</SectionLabel>
      <div className="space-y-0 divide-y divide-hairline/40">
        {fixtures.map((f) => {
          const r     = resultFor(f);
          const date  = new Date(f.kickoff).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          });
          const done  = f.status === "finished";

          return (
            <Link
              key={f.apiId}
              to={`/epl/match/${f.apiId}`}
              className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-steel/40 transition-colors rounded -mx-1 px-1"
            >
              {/* GW + date */}
              <div className="w-16 flex-shrink-0">
                <p className="label-caps text-muted leading-none">GW{f.matchweek}</p>
                <p className="text-[10px] text-muted/70 mt-0.5">{date}</p>
              </div>

              {/* H/A badge */}
              <span className="label-caps text-muted w-4 flex-shrink-0 text-center">
                {f.isHome ? "H" : "A"}
              </span>

              {/* Opponent */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <TeamCrest src={f.opponent.crestUrl} name={f.opponent.name} abbreviation={f.opponent.shortName} size={18} />
                <span className="text-sm text-bone font-medium truncate">
                  {f.opponent.shortName}
                </span>
              </div>

              {/* Score / result */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {done && f.teamScore !== null && f.oppScore !== null ? (
                  <>
                    <span className="text-sm font-mono text-silver tabular-nums">
                      {f.teamScore}–{f.oppScore}
                    </span>
                    {r && (
                      <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold ${resultColor(r)}`}>
                        {r}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted">
                    {new Date(f.kickoff).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
