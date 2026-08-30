import { useState, useEffect } from "react";
import {
  fetchFixtures, fetchStandings, fetchNews,
  groupMatchweeks, currentMatchweekIndex, groupByDate, timeAgo,
  computeMatchweekStats, computePositionChanges,
  type Matchweek, type ESPNFixture, type ESPNStandingEntry, type ESPNArticle,
  type MatchweekStats,
} from "../../lib/espn";
import { fetchHistoricalFixtures, fetchHistoricalStandings } from "../../lib/supabase";
import { resolveChannel, faviconUrl } from "../../lib/channels";

// ── Channel badge ─────────────────────────────────────────────────────────────

function ChannelBadge({ name }: { name: string }) {
  const info = resolveChannel(name);
  if (!info) {
    return (
      <span className="label-caps text-muted bg-surface-2 border border-border rounded px-1 py-0.5 text-[9px]">
        {name}
      </span>
    );
  }
  return (
    <a
      href={info.url}
      target="_blank"
      rel="noopener noreferrer"
      title={info.label}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center hover:opacity-70 transition-opacity"
    >
      <img
        src={faviconUrl(info.domain)}
        alt={info.label}
        style={{ width: 14, height: 14 }}
        className="rounded-sm"
      />
    </a>
  );
}

// ── Fixture row ───────────────────────────────────────────────────────────────

function FixtureRow({ fixture }: { fixture: ESPNFixture }) {
  const comp      = fixture.competitions[0];
  const status    = comp.status.type;
  const home      = comp.competitors.find((c) => c.homeAway === "home")!;
  const away      = comp.competitors.find((c) => c.homeAway === "away")!;
  const isLive    = status.state === "in";
  const isDone    = status.state === "post";
  const isPre     = status.state === "pre";
  const channels  = comp.broadcasts?.[0]?.names ?? [];

  const kickoff = new Date(fixture.date).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors
      ${isLive ? "bg-surface-2 ring-1 ring-pitch/25" : "bg-surface hover:bg-surface-2/40"}`}
    >
      {/* Home */}
      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
        <span className={`text-sm font-medium truncate ${
          isDone && !home.winner && !away.winner ? "text-subtle"
          : isDone && !home.winner ? "text-muted"
          : "text-bone"
        }`}>
          {home.team.shortDisplayName}
        </span>
        <img src={home.team.logo} alt="" style={{ width: 24, height: 24 }} className="object-contain flex-shrink-0" />
      </div>

      {/* Centre: score / time / status / channels */}
      <div className="w-32 flex-shrink-0 flex flex-col items-center gap-0.5">
        {isPre ? (
          <>
            <span className="text-sm text-bone">{kickoff}</span>
            {channels.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                {channels.map((ch) => <ChannelBadge key={ch} name={ch} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className={`text-xl font-mono font-bold leading-none ${
                isDone && home.winner ? "text-bone" : isDone ? "text-muted" : "text-bone"
              }`}>{home.score}</span>
              <span className="text-muted text-xs">–</span>
              <span className={`text-xl font-mono font-bold leading-none ${
                isDone && away.winner ? "text-bone" : isDone ? "text-muted" : "text-bone"
              }`}>{away.score}</span>
            </div>
            {isLive ? (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulse" />
                <span className="text-[10px] font-medium text-pitch">{comp.status.displayClock}</span>
              </div>
            ) : (
              <span className="text-[10px] text-muted label-caps">{status.shortDetail}</span>
            )}
          </>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
        <img src={away.team.logo} alt="" style={{ width: 24, height: 24 }} className="object-contain flex-shrink-0" />
        <span className={`text-sm font-medium truncate ${
          isDone && !home.winner && !away.winner ? "text-subtle"
          : isDone && !away.winner ? "text-muted"
          : "text-bone"
        }`}>
          {away.team.shortDisplayName}
        </span>
      </div>
    </div>
  );
}

// ── Matchweek navigator ───────────────────────────────────────────────────────

function MatchweekNav({
  matchweeks,
  index,
  onChange,
}: {
  matchweeks: Matchweek[];
  index: number;
  onChange: (i: number) => void;
}) {
  const mw = matchweeks[index];
  if (!mw) return null;

  const startLabel = new Date(mw.dates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel   = mw.dates.length > 1
    ? new Date(mw.dates[mw.dates.length - 1]).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, index - 1))}
        disabled={index === 0}
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-subtle hover:text-bone hover:border-subtle transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      <div className="text-center min-w-[140px]">
        <p className="text-sm font-semibold text-bone">{mw.label}</p>
        <p className="text-[10px] text-muted">
          {startLabel}{endLabel ? ` – ${endLabel}` : ""}
        </p>
      </div>
      <button
        onClick={() => onChange(Math.min(matchweeks.length - 1, index + 1))}
        disabled={index === matchweeks.length - 1}
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-subtle hover:text-bone hover:border-subtle transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}

// ── Standings table ───────────────────────────────────────────────────────────

function getStat(entry: ESPNStandingEntry, name: string): string {
  return entry.stats.find((s) => s.name === name)?.displayValue ?? "–";
}

const ZONE_MAP: Record<string, string> = {
  "4ead6a": "bg-pitch",
  "81d6ac": "bg-pitch/60",
  "f04f23": "bg-red",
  "f0a823": "bg-amber",
};

function zoneClass(hex: string): string {
  return ZONE_MAP[hex.toLowerCase().replace("#", "")] ?? "";
}

function StandingsTable({
  entries,
  mwStats,
  posChanges,
}: {
  entries: ESPNStandingEntry[];
  mwStats: Map<string, MatchweekStats>;
  posChanges: Map<string, number>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[280px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pl-1 pr-2 label-caps text-muted w-8">#</th>
            <th className="text-left py-2 label-caps text-muted">Club</th>
            <th className="text-center py-2 px-1 label-caps text-muted">MP</th>
            <th className="text-center py-2 px-1 label-caps text-muted">W</th>
            <th className="text-center py-2 px-1 label-caps text-muted">D</th>
            <th className="text-center py-2 px-1 label-caps text-muted">L</th>
            <th className="text-center py-2 px-1 label-caps text-muted">GD</th>
            <th className="text-center py-2 pl-1 label-caps text-muted">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {entries.map((entry, i) => {
            const pos    = parseInt(getStat(entry, "rank")) || i + 1;
            const noteHex = entry.note?.color ?? "";
            const logo   = entry.team.logos?.[0]?.href;
            const zone   = zoneClass(noteHex);

            const mw     = mwStats.get(entry.team.id);
            const change = posChanges.get(entry.team.id) ?? 0;

            return (
              <tr key={entry.team.id} className="hover:bg-surface-2/40 transition-colors">
                <td className="py-1.5 pl-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-0.5 h-4 rounded-full flex-shrink-0 ${zone || "opacity-0"}`} />
                    <div className="flex flex-col items-center min-w-[14px]">
                      <span className="text-muted tabular-nums leading-none">{pos}</span>
                      {change > 0 && (
                        <span className="text-[8px] leading-none font-semibold text-pitch">▲{change}</span>
                      )}
                      {change < 0 && (
                        <span className="text-[8px] leading-none font-semibold text-red">▼{Math.abs(change)}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-1">
                  <div className="flex items-center gap-1.5">
                    {logo && <img src={logo} alt="" style={{ width: 16, height: 16 }} className="object-contain flex-shrink-0" />}
                    <span className="text-bone font-medium truncate max-w-[88px]">
                      {entry.team.shortDisplayName}
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 px-1 text-subtle tabular-nums">{getStat(entry, "gamesPlayed")}</td>
                <td className="text-center py-2 px-1 text-subtle tabular-nums">{getStat(entry, "wins")}</td>
                <td className="text-center py-2 px-1 text-subtle tabular-nums">{getStat(entry, "ties")}</td>
                <td className="text-center py-2 px-1 text-subtle tabular-nums">{getStat(entry, "losses")}</td>
                <td className="text-center py-1.5 px-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-subtle tabular-nums">{getStat(entry, "pointDifferential")}</span>
                    {mw && mw.gd !== 0 && (
                      <span className={`text-[9px] font-semibold ${mw.gd > 0 ? "text-pitch" : "text-red"}`}>
                        {mw.gd > 0 ? `+${mw.gd}` : mw.gd}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-1.5 pl-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-bone font-bold tabular-nums">{getStat(entry, "points")}</span>
                    {mw && mw.pts === 3 && <span className="text-[9px] font-semibold text-pitch">+3</span>}
                    {mw && mw.pts === 1 && <span className="text-[9px] font-semibold text-amber">+1</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── News ──────────────────────────────────────────────────────────────────────

function NewsList({ articles }: { articles: ESPNArticle[] }) {
  return (
    <div className="divide-y divide-border/50">
      {articles.slice(0, 8).map((a, i) => (
        <a
          key={i}
          href={a.links.web.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-3 group"
        >
          <p className="text-sm font-medium text-bone group-hover:text-subtle transition-colors leading-snug">
            {a.headline}
          </p>
          {a.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{a.description}</p>
          )}
          <p className="label-caps text-muted/60 mt-1.5">{timeAgo(a.published)}</p>
        </a>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EPLDashboard() {
  const [matchweeks,       setMatchweeks]       = useState<Matchweek[]>([]);
  const [mwIndex,          setMwIndex]          = useState<number | null>(null);
  const [liveMwIndex,      setLiveMwIndex]      = useState<number | null>(null);
  const [season,           setSeason]           = useState<number>(new Date().getFullYear());
  const [fixtures,         setFixtures]         = useState<ESPNFixture[]>([]);
  const [liveStandings,    setLiveStandings]    = useState<ESPNStandingEntry[]>([]);
  const [snapshotStandings,setSnapshotStandings]= useState<ESPNStandingEntry[]>([]);
  const [standingsMode,    setStandingsMode]    = useState<"snapshot" | "live">("live");
  const [news,             setNews]             = useState<ESPNArticle[]>([]);
  const [loadingFix,       setLoadingFix]       = useState(true);
  const [loadingStd,       setLoadingStd]       = useState(true);
  const [loadingSnap,      setLoadingSnap]      = useState(false);
  const [loadingNews,      setLoadingNews]      = useState(true);
  const [errorFix,         setErrorFix]         = useState(false);
  const [errorStd,         setErrorStd]         = useState(false);

  // Bootstrap: calendar + live standings + news (once)
  useEffect(() => {
    fetchFixtures()
      .then(({ calendar, season: yr }) => {
        const weeks = groupMatchweeks(calendar);
        const idx   = currentMatchweekIndex(weeks);
        setMatchweeks(weeks);
        setMwIndex(idx);
        setLiveMwIndex(idx);
        setSeason(yr);
      })
      .catch(() => { setErrorFix(true); setLoadingFix(false); });

    fetchStandings()
      .then(setLiveStandings)
      .catch(() => setErrorStd(true))
      .finally(() => setLoadingStd(false));

    fetchNews()
      .then(setNews)
      .finally(() => setLoadingNews(false));
  }, []);

  // On matchweek change: fetch fixtures (ESPN or Supabase) + snapshot standings
  useEffect(() => {
    if (mwIndex === null || liveMwIndex === null || matchweeks.length === 0) return;
    const mw = matchweeks[mwIndex];
    const isHistorical = mwIndex < liveMwIndex;

    setLoadingFix(true);
    setErrorFix(false);
    setSnapshotStandings([]);

    // Default mode: snapshot for past weeks, live for current/future
    setStandingsMode(isHistorical ? "snapshot" : "live");

    // Fixtures
    if (isHistorical) {
      fetchHistoricalFixtures(mw.number)
        .then((f) => {
          if (f.length > 0) return setFixtures(f);
          // Empty = Supabase not yet synced or RLS blocking — fall back to ESPN
          const p = mw.start === mw.end ? mw.start : `${mw.start}-${mw.end}`;
          return fetchFixtures(p).then(({ fixtures }) => setFixtures(fixtures));
        })
        .catch((e) => {
          console.error("fetchHistoricalFixtures:", e);
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

    // Snapshot standings (always attempt — enables toggle on any matchweek)
    setLoadingSnap(true);
    fetchHistoricalStandings(mw.number, season)
      .then(setSnapshotStandings)
      .catch((e) => { console.error("fetchHistoricalStandings:", e); setSnapshotStandings([]); })
      .finally(() => setLoadingSnap(false));
  }, [mwIndex, liveMwIndex, matchweeks, season]);

  const standings = standingsMode === "live" ? liveStandings : snapshotStandings;

  const liveCount = fixtures.filter(
    (f) => f.competitions[0].status.type.state === "in"
  ).length;

  const days       = groupByDate(fixtures);
  const mwStats    = computeMatchweekStats(fixtures);
  const posChanges = computePositionChanges(standings, mwStats);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label-caps text-muted mb-1">Premier League</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-bone">2026–27 Season</h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-pitch bg-pitch/10 border border-pitch/20 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulse" />
                {liveCount} live
              </span>
            )}
          </div>
        </div>
        {matchweeks.length > 0 && mwIndex !== null && (
          <MatchweekNav
            matchweeks={matchweeks}
            index={mwIndex}
            onChange={setMwIndex}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Fixtures + News */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="label-caps text-muted mb-4">
              Fixtures{mwIndex !== null && matchweeks[mwIndex] ? ` — ${matchweeks[mwIndex].label}` : ""}
            </h2>

            {loadingFix ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : errorFix ? (
              <p className="text-sm text-muted py-6 text-center">Couldn't load fixtures.</p>
            ) : fixtures.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No fixtures this gameweek.</p>
            ) : (
              <div className="space-y-6">
                {days.map(({ label, fixtures: dayFixtures }) => (
                  <div key={label}>
                    <p className="label-caps text-muted mb-2">{label}</p>
                    <div className="space-y-1.5">
                      {dayFixtures.map((f) => <FixtureRow key={f.id} fixture={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="label-caps text-muted mb-4">News</h2>
            {loadingNews ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <NewsList articles={news} />
            )}
          </div>
        </div>

        {/* Right: Standings + Key */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="label-caps text-muted">Standings</h2>
              <div className="flex items-center gap-0.5 bg-surface-2 rounded p-0.5">
                <button
                  onClick={() => setStandingsMode("snapshot")}
                  disabled={snapshotStandings.length === 0}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    standingsMode === "snapshot"
                      ? "bg-ink text-bone font-semibold"
                      : "text-muted hover:text-subtle disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  {mwIndex !== null && matchweeks[mwIndex] ? matchweeks[mwIndex].label : "GW"}
                </button>
                <button
                  onClick={() => setStandingsMode("live")}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    standingsMode === "live"
                      ? "bg-ink text-bone font-semibold"
                      : "text-muted hover:text-subtle"
                  }`}
                >
                  Live
                </button>
              </div>
            </div>
            {(standingsMode === "live" ? loadingStd : loadingSnap) ? (
              <div className="space-y-2">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : errorStd && standingsMode === "live" ? (
              <p className="text-sm text-muted py-6 text-center">Couldn't load standings.</p>
            ) : (
              <StandingsTable entries={standings} mwStats={mwStats} posChanges={posChanges} />
            )}
          </div>

          {standings.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="label-caps text-muted mb-3">Key</h3>
              <div className="space-y-1.5 text-xs text-subtle">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pitch" />Champions League</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pitch/60" />Europa League</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber" />Conference League</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red" />Relegation</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
