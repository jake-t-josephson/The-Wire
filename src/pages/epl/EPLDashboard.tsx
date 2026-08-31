import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchFixtures, fetchStandings, fetchEPLNews,
  groupMatchweeks, currentMatchweekIndex, groupByDate, timeAgo,
  computeMatchweekStats, computePositionChanges,
  type Matchweek, type ESPNFixture, type ESPNStandingEntry, type EPLArticle,
  type MatchweekStats,
} from "../../lib/espn";
import { fetchHistoricalFixtures, fetchHistoricalStandings } from "../../lib/supabase";
import { resolveChannel, faviconUrl } from "../../lib/channels";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { StatusDot } from "../../components/sports/StatusDot";
import { TeamCrest } from "../../components/sports/TeamCrest";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Skeleton } from "../../components/ui/Skeleton";
import { Tabs } from "../../components/ui/Tabs";
import { Eyebrow, SectionLabel } from "../../components/ui/Typography";

// ── Fixture row ───────────────────────────────────────────────────────────────

function ChannelBadge({ name }: { name: string }) {
  const info = resolveChannel(name);
  if (!info) return (
    <Badge>{name}</Badge>
  );
  return (
    <a href={info.url} target="_blank" rel="noopener noreferrer" title={info.label}
      onClick={(e) => e.stopPropagation()} className="inline-flex items-center hover:opacity-70 transition-opacity">
      <img src={faviconUrl(info.domain)} alt={info.label} style={{ width: 12, height: 12 }} className="rounded-sm" />
    </a>
  );
}

function FixtureRow({ fixture }: { fixture: ESPNFixture }) {
  const navigate = useNavigate();
  const comp    = fixture.competitions[0];
  const status  = comp.status.type;
  const home    = comp.competitors.find((c) => c.homeAway === "home")!;
  const away    = comp.competitors.find((c) => c.homeAway === "away")!;
  const isLive  = status.state === "in";
  const isDone  = status.state === "post";
  const isPre   = status.state === "pre";
  const channels = comp.broadcasts?.[0]?.names ?? [];
  const isWire  = isLive && comp.status.displayClock && parseInt(comp.status.displayClock) >= 88;
  const venue    = comp.venue?.fullName ?? null;

  const homeWin = isDone && home.winner;
  const awayWin = isDone && away.winner;

  const kickoff = new Date(fixture.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div
      onClick={() => navigate(`/epl/match/${fixture.id}`)}
      className="grid cursor-pointer transition-colors"
      style={{
        gridTemplateColumns: "1fr 96px 1fr",
        gap: 14,
        padding: "13px 12px",
        borderBottom: "1px solid var(--color-hairline)",
        background: isLive ? "var(--color-slate)" : "transparent",
        borderLeft: isLive ? "3px solid var(--color-signal)" : "3px solid transparent",
        marginLeft: isLive ? 0 : 0,
      }}
    >
      {/* Home */}
      <div className="flex items-center justify-end gap-[11px] min-w-0">
        <span
          className="font-display uppercase truncate"
          style={{ fontSize: 26, lineHeight: 1, color: !isDone || homeWin ? "var(--color-bone)" : "var(--color-silver)" }}
        >
          {home.team.shortDisplayName}
        </span>
        <TeamCrest src={home.team.logo} name={home.team.displayName} abbreviation={home.team.abbreviation} />
      </div>

      {/* Centre */}
      <div className="flex flex-col items-center justify-center gap-1">
        {isPre ? (
          <>
            <span className="font-display text-bone" style={{ fontSize: 22, lineHeight: 1 }}>{kickoff}</span>
            {channels.length > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {channels.map((ch) => <ChannelBadge key={ch} name={ch} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-[9px]">
              <span className="font-display" style={{ fontSize: 27, lineHeight: 1, color: !isDone || homeWin ? "var(--color-bone)" : "var(--color-silver)" }}>
                {home.score}
              </span>
              <span className="text-muted" style={{ fontSize: 14 }}>–</span>
              <span className="font-display" style={{ fontSize: 27, lineHeight: 1, color: !isDone || awayWin ? "var(--color-bone)" : "var(--color-silver)" }}>
                {away.score}
              </span>
            </div>
            {isLive ? (
              <div className="flex items-center justify-center gap-[5px]">
                <StatusDot state={isWire ? "wire" : "live"} />
                <span className="font-mono text-signal" style={{ fontSize: 8, letterSpacing: "0.14em" }}>
                  {comp.status.displayClock}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-[5px]">
                <StatusDot state="final" />
                <span className="font-mono text-muted" style={{ fontSize: 8, letterSpacing: "0.14em" }}>FT</span>
              </div>
            )}
          </>
        )}
        {venue && (
          <span className="font-mono text-muted text-center" style={{ fontSize: 7.5, letterSpacing: "0.08em" }}>{venue}</span>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-[11px] min-w-0">
        <TeamCrest src={away.team.logo} name={away.team.displayName} abbreviation={away.team.abbreviation} />
        <span
          className="font-display uppercase truncate"
          style={{ fontSize: 26, lineHeight: 1, color: !isDone || awayWin ? "var(--color-bone)" : "var(--color-silver)" }}
        >
          {away.team.shortDisplayName}
        </span>
      </div>
    </div>
  );
}

// ── Matchweek navigator ───────────────────────────────────────────────────────

function MatchweekNav({ matchweeks, index, onChange }: {
  matchweeks: Matchweek[]; index: number; onChange: (i: number) => void;
}) {
  const mw = matchweeks[index];
  if (!mw) return null;
  const startLabel = new Date(mw.dates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel   = mw.dates.length > 1
    ? new Date(mw.dates[mw.dates.length - 1]).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="flex items-center gap-4">
      <Button iconOnly aria-label="Previous matchweek" onClick={() => onChange(Math.max(0, index - 1))} disabled={index === 0}>‹</Button>
      <div className="text-center" style={{ minWidth: 112 }}>
        <div className="font-display uppercase text-bone" style={{ fontSize: 26, lineHeight: 1 }}>{mw.label}</div>
        <div className="font-mono uppercase text-muted mt-1" style={{ fontSize: 8.5, letterSpacing: "0.14em" }}>
          {startLabel}{endLabel ? ` – ${endLabel}` : ""}
        </div>
      </div>
      <Button iconOnly aria-label="Next matchweek" onClick={() => onChange(Math.min(matchweeks.length - 1, index + 1))} disabled={index === matchweeks.length - 1}>›</Button>
    </div>
  );
}

// ── Standings ─────────────────────────────────────────────────────────────────

function getStat(entry: ESPNStandingEntry, name: string) {
  return entry.stats.find((s) => s.name === name);
}

const ZONE_MAP: Record<string, string> = {
  "4ead6a": "var(--color-signal)",
  "81d6ac": "color-mix(in srgb, var(--color-signal) 50%, transparent)",
  "f04f23": "var(--color-down)",
  "f0a823": "var(--color-amber)",
};

function zoneColor(hex: string): string | null {
  return ZONE_MAP[hex.toLowerCase().replace("#", "")] ?? null;
}

function StandingsTable({ entries, mwStats, posChanges }: {
  entries: ESPNStandingEntry[];
  mwStats: Map<string, MatchweekStats>;
  posChanges: Map<string, number>;
}) {
  const navigate = useNavigate();
  // grid: 34px 1fr 26px 26px 26px 26px 34px 34px
  const grid = "34px 1fr 26px 26px 26px 26px 34px 34px";

  return (
    <div>
      {/* Header row */}
      <div className="grid font-mono uppercase text-muted pb-[10px]" style={{ gridTemplateColumns: grid, gap: 6, fontSize: 8, letterSpacing: "0.14em", borderBottom: "1px solid var(--color-hairline)" }}>
        <span>#</span><span>Club</span>
        <span className="text-right">MP</span><span className="text-right">W</span>
        <span className="text-right">D</span><span className="text-right">L</span>
        <span className="text-right">GD</span><span className="text-right">Pts</span>
      </div>

      {entries.map((entry, i) => {
        const pos     = parseInt(getStat(entry, "rank")?.displayValue ?? "") || i + 1;
        const noteHex = entry.note?.color ?? "";
        const zColor  = zoneColor(noteHex);
        const logo    = entry.team.logos?.[0]?.href;
        const abbr    = entry.team.abbreviation || entry.team.shortDisplayName.slice(0, 3);
        const change  = posChanges.get(entry.team.id) ?? 0;
        const mw      = mwStats.get(entry.team.id);

        const mp  = getStat(entry, "gamesPlayed")?.displayValue  ?? "–";
        const w   = getStat(entry, "wins")?.displayValue          ?? "–";
        const d   = getStat(entry, "ties")?.displayValue          ?? "–";
        const l   = getStat(entry, "losses")?.displayValue        ?? "–";
        const gd  = getStat(entry, "pointDifferential")?.displayValue ?? "–";
        const pts = getStat(entry, "points")?.displayValue        ?? "–";

        return (
          <div
            key={entry.team.id}
            onClick={() => navigate(`/epl/team/${entry.team.id}`)}
            className="grid items-center cursor-pointer transition-colors hover:bg-slate"
            style={{
              gridTemplateColumns: grid,
              gap: 6,
              padding: "8px 0",
              borderBottom: "1px solid var(--color-hairline)",
              borderLeft: zColor ? `2px solid ${zColor}` : "2px solid transparent",
              paddingLeft: zColor ? 6 : 0,
              marginLeft: zColor ? -8 : 0,
            }}
          >
            {/* # + change */}
            <div className="flex items-baseline gap-[3px]">
              <span className="font-display text-bone" style={{ fontSize: 17, lineHeight: 1 }}>{pos}</span>
              {change > 0 && <span className="font-mono text-up" style={{ fontSize: 7, lineHeight: 1 }}>▲{change}</span>}
              {change < 0 && <span className="font-mono text-down" style={{ fontSize: 7, lineHeight: 1 }}>▼{Math.abs(change)}</span>}
            </div>

            {/* Club */}
            <div className="flex items-center gap-2 min-w-0">
              <TeamCrest src={logo} name={entry.team.displayName} abbreviation={abbr} size={17} />
              <span className="font-display uppercase text-bone truncate" style={{ fontSize: 18, lineHeight: 1 }}>
                {entry.team.shortDisplayName}
              </span>
            </div>

            {/* Stats */}
            {[mp, w, d, l].map((v, idx) => (
              <span key={idx} className="font-mono text-silver text-right tabular-nums" style={{ fontSize: 10 }}>{v}</span>
            ))}
            <span className="font-mono text-bone text-right tabular-nums" style={{ fontSize: 10 }}>
              {gd}
              {mw && mw.gd !== 0 && (
                <span className={mw.gd > 0 ? "ml-0.5 text-up" : "ml-0.5 text-down"} style={{ fontSize: 8 }}>
                  {mw.gd > 0 ? `+${mw.gd}` : mw.gd}
                </span>
              )}
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-display text-bone text-right" style={{ fontSize: 17, lineHeight: 1 }}>{pts}</span>
              {mw && mw.pts === 3 && <span className="font-mono text-up" style={{ fontSize: 8 }}>+3</span>}
              {mw && mw.pts === 1 && <span className="font-mono text-amber" style={{ fontSize: 8 }}>+1</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── News ──────────────────────────────────────────────────────────────────────

const EPL_SOURCE_META: Record<string, { color: string; logo: string; label: string }> = {
  ESPN:          { color: "#dd0300",  logo: faviconUrl("espn.com"),          label: "ESPN" },
  "The Guardian":{ color: "#082864",  logo: faviconUrl("theguardian.com"),   label: "The Guardian" },
  "BBC Sport":   { color: "#fdd12c",  logo: faviconUrl("bbc.co.uk"),         label: "BBC Sport" },
  "Sky Sports":  { color: "#030fa2",  logo: faviconUrl("skysports.com"),     label: "Sky Sports" },
  "The Ringer":  { color: "#05b113",  logo: faviconUrl("theringer.com"),     label: "The Ringer" },
};

const EPL_ALL_SOURCES = Object.keys(EPL_SOURCE_META);
const EPL_PAGE_SIZE   = 10;

function NewsList({ articles }: { articles: EPLArticle[] }) {
  const [active,  setActive]  = useState<Set<string>>(new Set(EPL_ALL_SOURCES));
  const [visible, setVisible] = useState(EPL_PAGE_SIZE);

  const toggle = (src: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(src)) { if (next.size > 1) next.delete(src); }
      else next.add(src);
      return next;
    });
    setVisible(EPL_PAGE_SIZE);
  };

  const filtered = articles.filter((a) => active.has(a.source));
  const shown    = filtered.slice(0, visible);
  const hasMore  = visible < filtered.length;

  return (
    <div>
      {/* Source filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {EPL_ALL_SOURCES.map((src) => {
          const meta = EPL_SOURCE_META[src];
          const on   = active.has(src);
          return (
            <button
              key={src}
              onClick={() => toggle(src)}
              className="flex items-center gap-[6px] transition-opacity"
              style={{
                padding: "5px 10px",
                borderRadius: 3,
                border: `1px solid ${on ? meta.color : "var(--color-steel)"}`,
                background: on ? `color-mix(in srgb, ${meta.color} 12%, transparent)` : "transparent",
                opacity: on ? 1 : 0.45,
                cursor: "pointer",
              }}
            >
              <img src={meta.logo} alt={meta.label} style={{ width: 12, height: 12, borderRadius: 2, objectFit: "contain" }} />
              <span className="font-mono uppercase" style={{ fontSize: 8, letterSpacing: "0.14em", color: on ? meta.color : "var(--color-muted)" }}>
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>

      {shown.map((a, i) => {
        const meta = EPL_SOURCE_META[a.source];
        return (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
            className="block group" style={{ padding: "14px 0", borderBottom: "1px solid var(--color-hairline)" }}>
            <div className="flex items-center gap-2 mb-1">
              {meta && <img src={meta.logo} alt={meta.label} style={{ width: 12, height: 12, borderRadius: 2, objectFit: "contain", flexShrink: 0 }} />}
              <span className="font-mono uppercase" style={{ fontSize: 7.5, letterSpacing: "0.14em", color: meta?.color ?? "var(--color-muted)", flexShrink: 0 }}>
                {a.source}
              </span>
              <span className="font-mono text-muted" style={{ fontSize: 7.5, letterSpacing: "0.12em" }}>{timeAgo(a.published)}</span>
            </div>
            <p className="font-display uppercase text-bone group-hover:text-silver transition-colors leading-snug" style={{ fontSize: 17, lineHeight: 1.15 }}>
              {a.headline}
            </p>
            {a.description && (
              <p className="font-serif text-silver mt-1.5 line-clamp-2" style={{ fontSize: 14, lineHeight: 1.45 }}>
                {a.description}
              </p>
            )}
          </a>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setVisible((v) => v + EPL_PAGE_SIZE)}
          className="font-mono uppercase text-muted hover:text-bone transition-colors w-full text-center"
          style={{ padding: "14px 0", fontSize: 9, letterSpacing: "0.18em" }}
        >
          Load More
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EPLDashboard() {
  const [matchweeks,        setMatchweeks]        = useState<Matchweek[]>([]);
  const [mwIndex,           setMwIndex]           = useState<number | null>(null);
  const [liveMwIndex,       setLiveMwIndex]       = useState<number | null>(null);
  const [season,            setSeason]            = useState<number>(new Date().getFullYear());
  const [leagueLogo,        setLeagueLogo]        = useState<string | null>(null);
  const [fixtures,          setFixtures]          = useState<ESPNFixture[]>([]);
  const [liveStandings,     setLiveStandings]     = useState<ESPNStandingEntry[]>([]);
  const [snapshotStandings, setSnapshotStandings] = useState<ESPNStandingEntry[]>([]);
  const [standingsMode,     setStandingsMode]     = useState<"snapshot" | "live">("live");
  const [news,              setNews]              = useState<EPLArticle[]>([]);
  const [loadingFix,        setLoadingFix]        = useState(true);
  const [loadingStd,        setLoadingStd]        = useState(true);
  const [loadingSnap,       setLoadingSnap]       = useState(false);
  const [loadingNews,       setLoadingNews]       = useState(true);
  const [errorFix,          setErrorFix]          = useState(false);
  const [errorStd,          setErrorStd]          = useState(false);

  useEffect(() => {
    fetchFixtures()
      .then(({ calendar, season: yr, leagueLogo: logo }) => {
        const weeks = groupMatchweeks(calendar);
        const idx   = currentMatchweekIndex(weeks);
        setMatchweeks(weeks);
        setMwIndex(idx);
        setLiveMwIndex(idx);
        setSeason(yr);
        if (logo) setLeagueLogo(logo);
      })
      .catch(() => { setErrorFix(true); setLoadingFix(false); });

    fetchStandings()
      .then(setLiveStandings)
      .catch(() => setErrorStd(true))
      .finally(() => setLoadingStd(false));

    fetchEPLNews()
      .then(setNews)
      .finally(() => setLoadingNews(false));
  }, []);

  useEffect(() => {
    if (mwIndex === null || liveMwIndex === null || matchweeks.length === 0) return;
    const mw = matchweeks[mwIndex];
    const isHistorical = mwIndex < liveMwIndex;

    setLoadingFix(true);
    setErrorFix(false);
    setSnapshotStandings([]);
    setStandingsMode(isHistorical ? "snapshot" : "live");

    if (isHistorical) {
      fetchHistoricalFixtures(mw.number)
        .then((f) => {
          if (f.length > 0) return setFixtures(f);
          const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
          return fetchFixtures(p).then(({ fixtures }) => setFixtures(fixtures));
        })
        .catch(() => {
          const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
          return fetchFixtures(p).then(({ fixtures }) => setFixtures(fixtures));
        })
        .finally(() => setLoadingFix(false));
    } else {
      const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
      fetchFixtures(p)
        .then(({ fixtures }) => setFixtures(fixtures))
        .catch(() => setErrorFix(true))
        .finally(() => setLoadingFix(false));
    }

    setLoadingSnap(true);
    fetchHistoricalStandings(mw.number, season)
      .then(setSnapshotStandings)
      .catch(() => setSnapshotStandings([]))
      .finally(() => setLoadingSnap(false));
  }, [mwIndex, liveMwIndex, matchweeks, season]);

  const standings  = standingsMode === "live" ? liveStandings : snapshotStandings;
  const liveCount  = fixtures.filter((f) => f.competitions[0].status.type.state === "in").length;
  const days       = groupByDate(fixtures);
  const mwStats    = standingsMode === "live" ? computeMatchweekStats(fixtures) : new Map<string, MatchweekStats>();
  const posChanges = standingsMode === "live" ? computePositionChanges(standings, mwStats) : new Map<string, number>();
  const currentMw  = mwIndex !== null ? matchweeks[mwIndex] : null;

  return (
    <PageContainer>
      <PageHeader
        leading={leagueLogo && <img src={leagueLogo} alt="Premier League" style={{ width: 52, height: 52, objectFit: "contain" }} />}
        eyebrow={<Eyebrow signal className="mb-2.5">Premier League</Eyebrow>}
        title="2026–27 Season"
        actions={
          <>
          {liveCount > 0 && (
            <div className="label-caps flex items-center gap-1.5 text-signal">
              <StatusDot state="wire" />
              {liveCount} live
            </div>
          )}
          {matchweeks.length > 0 && mwIndex !== null && (
            <MatchweekNav matchweeks={matchweeks} index={mwIndex} onChange={setMwIndex} />
          )}
          </>
        }
      />

      {/* Tab bar */}
      <Tabs
        label="Premier League sections"
        value="fixtures"
        items={[
          { label: "Fixtures", value: "fixtures" },
          { label: "Table", value: "table", disabled: true },
          { label: "Wireroom", value: "wireroom", disabled: true },
          { label: "Stats", value: "stats", disabled: true },
          { label: "Clubs", value: "clubs", disabled: true },
        ]}
      />

      {/* Content grid */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_452px]">
        {/* Left: Fixtures */}
        <div className="py-[26px] lg:pr-[34px]">
          <SectionLabel className="mb-5">
            Fixtures{currentMw ? ` — ${currentMw.label}` : ""}
          </SectionLabel>

          {loadingFix ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : errorFix ? (
            <p className="empty-state">Couldn't load fixtures.</p>
          ) : fixtures.length === 0 ? (
            <p className="empty-state">No fixtures this gameweek.</p>
          ) : (
            <div>
              {days.map(({ label, fixtures: dayFixtures }) => (
                <div key={label}>
                  <div className="eyebrow eyebrow--signal mb-3 mt-[22px]">
                    {label}
                  </div>
                  {dayFixtures.map((f) => <FixtureRow key={f.id} fixture={f} />)}
                </div>
              ))}
            </div>
          )}

          {/* News */}
          {!loadingNews && news.length > 0 && (
            <div className="mt-10">
              <SectionLabel className="mb-4">News</SectionLabel>
              <NewsList articles={news} />
            </div>
          )}
        </div>

        {/* Right: Standings */}
        <aside className="border-t border-hairline py-[26px] lg:border-l lg:border-t-0 lg:pl-[26px]">
          <div className="mb-[18px] flex items-center gap-3">
            <SectionLabel>Standings</SectionLabel>
            <div className="ml-auto">
              <SegmentedControl
                label="Standings view"
                value={standingsMode}
                onChange={setStandingsMode}
                items={[
                  { value: "snapshot", label: currentMw?.label ?? "GW", disabled: snapshotStandings.length === 0 },
                  { value: "live", label: "Live" },
                ]}
              />
            </div>
          </div>

          {(standingsMode === "live" ? loadingStd : loadingSnap) ? (
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} height={33} />)}
            </div>
          ) : errorStd && standingsMode === "live" ? (
            <p className="empty-state">Couldn't load standings.</p>
          ) : (
            <StandingsTable entries={standings} mwStats={mwStats} posChanges={posChanges} />
          )}

          {standings.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {[
                  { color: "var(--color-signal)", label: "Champions League" },
                  { color: "color-mix(in srgb, var(--color-signal) 50%, transparent)", label: "Europa League" },
                  { color: "var(--color-amber)", label: "Conference League" },
                  { color: "var(--color-down)", label: "Relegation" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 font-mono uppercase text-muted" style={{ fontSize: 8, letterSpacing: "0.12em" }}>
                    <div className="rounded-full" style={{ width: 2, height: 11, background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
