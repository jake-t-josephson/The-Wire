import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMatchSummary, type ESPNMatchSummary } from "../../lib/espn";

// ── Stat config ───────────────────────────────────────────────────────────────

const STATS = [
  { name: "totalShots",     label: "Shots" },
  { name: "shotsOnTarget",  label: "On Target" },
  { name: "saves",          label: "Saves" },
  { name: "wonCorners",     label: "Corners" },
  { name: "foulsCommitted", label: "Fouls" },
  { name: "yellowCards",    label: "Yellow Cards" },
  { name: "redCards",       label: "Red Cards" },
  { name: "offsides",       label: "Offsides" },
];

function getStat(stats: Array<{ name: string; displayValue: string }>, name: string): string {
  return stats.find((s) => s.name === name)?.displayValue ?? "0";
}

// ── Possession bar ────────────────────────────────────────────────────────────

function PossessionBar({ home, away }: { home: number; away: number }) {
  return (
    <div className="space-y-2 py-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-bone tabular-nums">{home}%</span>
        <span className="label-caps text-muted">Possession</span>
        <span className="text-sm font-semibold text-bone tabular-nums">{away}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden flex">
        <div className="h-full bg-pitch transition-all duration-500" style={{ width: `${home}%` }} />
        <div className="h-full bg-sky transition-all duration-500" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away;
  const homeW = total > 0 ? (home / total) * 100 : 50;
  const awayW = 100 - homeW;

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex justify-between items-center">
        <span className={`text-sm font-semibold tabular-nums ${home > away ? "text-bone" : "text-muted"}`}>{home}</span>
        <span className="label-caps text-muted">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${away > home ? "text-bone" : "text-muted"}`}>{away}</span>
      </div>
      <div className="flex gap-1 items-center">
        <div className="flex-1 flex justify-end">
          <div className="h-1 rounded-l-full bg-pitch transition-all duration-500" style={{ width: `${homeW}%` }} />
        </div>
        <div className="w-px h-2 bg-border flex-shrink-0" />
        <div className="flex-1">
          <div className="h-1 rounded-r-full bg-sky transition-all duration-500" style={{ width: `${awayW}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MatchDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate    = useNavigate();
  const [summary, setSummary] = useState<ESPNMatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    fetchMatchSummary(eventId)
      .then((s) => { setSummary(s); if (!s) setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => navigate("/epl")}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-subtle transition-colors mb-6 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">‹</span>
        Premier League
      </button>

      {loading ? (
        <MatchSkeleton />
      ) : error || !summary ? (
        <p className="text-sm text-muted text-center py-16">Couldn't load match data.</p>
      ) : (
        <MatchContent summary={summary} />
      )}
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-8">
        <div className="flex items-center gap-6">
          <div className="flex-1 flex flex-col items-end gap-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[100px]">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex-1 flex flex-col items-start gap-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    </div>
  );
}

function MatchContent({ summary }: { summary: ESPNMatchSummary }) {
  const { homeTeam, awayTeam, status, date, venue, homeStats, awayStats } = summary;
  const isLive = status.state === "in";
  const isPre  = status.state === "pre";

  const kickoff = new Date(date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  const homePoss = parseFloat(getStat(homeStats, "possessionPct")) || 0;
  const awayPoss = parseFloat(getStat(awayStats, "possessionPct")) || 0;
  const hasStats = homeStats.length > 0;

  return (
    <div className="space-y-4">
      {/* Match header */}
      <div className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Home */}
          <div className="flex-1 flex flex-col items-end gap-2 min-w-0">
            <img src={homeTeam.logo} alt="" style={{ width: 56, height: 56 }} className="object-contain flex-shrink-0" />
            <p className="text-sm md:text-base font-semibold text-bone text-right leading-snug">
              {homeTeam.displayName}
            </p>
          </div>

          {/* Score / time */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {isPre ? (
              <>
                <p className="text-2xl font-mono font-bold text-bone">
                  {new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="label-caps text-muted">Kickoff</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl font-mono font-bold text-bone">{homeTeam.score}</span>
                  <span className="text-xl text-muted">–</span>
                  <span className="text-4xl md:text-5xl font-mono font-bold text-bone">{awayTeam.score}</span>
                </div>
                {isLive ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulse" />
                    <span className="text-xs font-medium text-pitch">{status.clock}</span>
                  </div>
                ) : (
                  <p className="label-caps text-muted">{status.detail}</p>
                )}
              </>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-start gap-2 min-w-0">
            <img src={awayTeam.logo} alt="" style={{ width: 56, height: 56 }} className="object-contain flex-shrink-0" />
            <p className="text-sm md:text-base font-semibold text-bone leading-snug">
              {awayTeam.displayName}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-xs text-muted">{kickoff}</span>
          {venue && (
            <>
              <span className="text-border">·</span>
              <span className="text-xs text-muted">{venue}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {!isPre && (
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pitch" />
              <span className="text-xs font-medium text-subtle">{homeTeam.shortDisplayName}</span>
            </div>
            <h2 className="label-caps text-muted">Match Stats</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-subtle">{awayTeam.shortDisplayName}</span>
              <div className="w-2.5 h-2.5 rounded-full bg-sky" />
            </div>
          </div>

          {!hasStats ? (
            <p className="text-sm text-muted text-center py-6">Stats not yet available.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {homePoss > 0 && (
                <div className="py-1">
                  <PossessionBar home={homePoss} away={awayPoss} />
                </div>
              )}
              {STATS.map(({ name, label }) => {
                const h = parseFloat(getStat(homeStats, name)) || 0;
                const a = parseFloat(getStat(awayStats, name)) || 0;
                if (h === 0 && a === 0) return null;
                return (
                  <div key={name} className="py-1">
                    <StatRow label={label} home={h} away={a} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
