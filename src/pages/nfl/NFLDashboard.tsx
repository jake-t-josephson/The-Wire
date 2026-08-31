import { useState, useEffect } from "react";
import {
  fetchNFLScoreboard, fetchNFLStandings, fetchNFLNews,
  groupByDivision, weekDateRange, getStat, NFL_TOTAL_WEEKS,
  type NFLGame, type NFLStandingEntry, type NFLConference, type NFLArticle,
} from "../../lib/nfl";
import { timeAgo } from "../../lib/espn";
import { resolveChannel, faviconUrl } from "../../lib/channels"; // faviconUrl used in ChannelIcon
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { TeamCrest } from "../../components/sports/TeamCrest";
import { StatusDot } from "../../components/sports/StatusDot";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Skeleton } from "../../components/ui/Skeleton";
import { Eyebrow, SectionLabel } from "../../components/ui/Typography";

// ── Game row ──────────────────────────────────────────────────────────────────

function ChannelIcon({ name }: { name: string }) {
  const info = resolveChannel(name);
  if (!info) return (
    <span className="font-mono uppercase text-muted" style={{ fontSize: 8, letterSpacing: "0.14em" }}>{name}</span>
  );
  return (
    <img
      src={faviconUrl(info.domain)}
      alt={info.label}
      title={info.label}
      style={{ width: 14, height: 14, borderRadius: 2 }}
    />
  );
}

function GameRow({ game }: { game: NFLGame }) {
  const comp   = game.competitions[0];
  const status = comp.status.type;
  const home   = comp.competitors.find((c) => c.homeAway === "home")!;
  const away   = comp.competitors.find((c) => c.homeAway === "away")!;
  const isLive = status.state === "in";
  const isDone = status.state === "post";
  const isPre  = status.state === "pre";

  const homeWin = isDone && home.winner === true;
  const awayWin = isDone && away.winner === true;
  const networks = comp.broadcasts?.[0]?.names ?? [];
  const venue    = comp.venue ? `${comp.venue.address.city}, ${comp.venue.address.state}` : null;

  const matchup = `${away.team.abbreviation} @ ${home.team.abbreviation}`;
  const kickoff = isPre
    ? new Date(game.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
    : null;

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "1fr 140px 1fr",
        gap: 12,
        padding: "13px 12px",
        borderBottom: "1px solid var(--color-hairline)",
        background: isLive ? "var(--color-slate)" : "transparent",
        borderLeft: isLive ? "3px solid var(--color-signal)" : "3px solid transparent",
      }}
    >
      {/* Away (left) */}
      <div className="flex items-center justify-end gap-[11px] min-w-0">
        <span
          className="font-display uppercase truncate"
          style={{ fontSize: 24, lineHeight: 1, color: !isDone || awayWin ? "var(--color-bone)" : "var(--color-silver)" }}
        >
          {away.team.abbreviation}
        </span>
        <TeamCrest src={away.team.logo} name={away.team.displayName} abbreviation={away.team.abbreviation} />
      </div>

      {/* Centre */}
      <div className="flex flex-col items-center justify-center gap-[5px]">
        {/* matchup string always shown */}
        <span className="font-mono text-muted" style={{ fontSize: 8, letterSpacing: "0.10em" }}>{matchup}</span>

        {isPre ? (
          <>
            <span className="font-mono text-silver text-center" style={{ fontSize: 10.5, lineHeight: 1 }}>{kickoff}</span>
            {networks.length > 0 && (
              <div className="flex items-center gap-[5px]">
                {networks.map((n) => <ChannelIcon key={n} name={n} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-[9px]">
              <span className="font-display" style={{ fontSize: 27, lineHeight: 1, color: !isDone || awayWin ? "var(--color-bone)" : "var(--color-silver)" }}>
                {away.score}
              </span>
              <span className="text-muted" style={{ fontSize: 14 }}>–</span>
              <span className="font-display" style={{ fontSize: 27, lineHeight: 1, color: !isDone || homeWin ? "var(--color-bone)" : "var(--color-silver)" }}>
                {home.score}
              </span>
            </div>
            {isLive ? (
              <div className="flex items-center gap-[5px]">
                <StatusDot state="live" />
                <span className="font-mono text-signal" style={{ fontSize: 8, letterSpacing: "0.14em" }}>
                  {comp.status.displayClock} {status.shortDetail.split(" ").slice(-1)[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-[5px]">
                <StatusDot state="final" />
                <span className="font-mono text-muted" style={{ fontSize: 8, letterSpacing: "0.14em" }}>FINAL</span>
              </div>
            )}
          </>
        )}

        {/* Venue */}
        {venue && (
          <span className="font-mono text-muted text-center" style={{ fontSize: 7.5, letterSpacing: "0.08em" }}>{venue}</span>
        )}
      </div>

      {/* Home (right) */}
      <div className="flex items-center gap-[11px] min-w-0">
        <TeamCrest src={home.team.logo} name={home.team.displayName} abbreviation={home.team.abbreviation} />
        <span
          className="font-display uppercase truncate"
          style={{ fontSize: 24, lineHeight: 1, color: !isDone || homeWin ? "var(--color-bone)" : "var(--color-silver)" }}
        >
          {home.team.abbreviation}
        </span>
      </div>
    </div>
  );
}

// ── News ──────────────────────────────────────────────────────────────────────

const SOURCE_META: Record<string, { color: string; logo: string; label: string }> = {
  ESPN:            { color: "#dd0300",             logo: faviconUrl("espn.com"),          label: "ESPN" },
  ProFootballTalk: { color: "var(--color-bone)",   logo: "/brand/pft-logo.webp",          label: "ProFootballTalk" },
  "The Ringer":    { color: "#05b113",             logo: faviconUrl("theringer.com"),     label: "The Ringer" },
};

const ALL_SOURCES = Object.keys(SOURCE_META);
const PAGE_SIZE   = 10;

function NewsList({ articles }: { articles: NFLArticle[] }) {
  const [active,  setActive]  = useState<Set<string>>(new Set(ALL_SOURCES));
  const [visible, setVisible] = useState(PAGE_SIZE);

  const toggle = (src: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(src)) { if (next.size > 1) next.delete(src); }
      else next.add(src);
      return next;
    });
    setVisible(PAGE_SIZE);
  };

  const filtered = articles.filter((a) => active.has(a.source));
  const shown    = filtered.slice(0, visible);
  const hasMore  = visible < filtered.length;

  return (
    <div>
      {/* Source filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_SOURCES.map((src) => {
          const meta = SOURCE_META[src];
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
                background: on ? "color-mix(in srgb, " + meta.color + " 12%, transparent)" : "transparent",
                opacity: on ? 1 : 0.45,
                cursor: "pointer",
              }}
            >
              <img
                src={meta.logo}
                alt={meta.label}
                style={{ width: 12, height: 12, borderRadius: 2, objectFit: "contain" }}
              />
              <span
                className="font-mono uppercase"
                style={{ fontSize: 8, letterSpacing: "0.14em", color: on ? meta.color : "var(--color-muted)" }}
              >
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Article list */}
      {shown.map((a, i) => {
        const meta = SOURCE_META[a.source];
        return (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            style={{ padding: "14px 0", borderBottom: "1px solid var(--color-hairline)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              {meta && (
                <img
                  src={meta.logo}
                  alt={meta.label}
                  style={{ width: 12, height: 12, borderRadius: 2, objectFit: "contain", flexShrink: 0 }}
                />
              )}
              <span
                className="font-mono uppercase"
                style={{ fontSize: 7.5, letterSpacing: "0.14em", color: meta?.color ?? "var(--color-muted)", flexShrink: 0 }}
              >
                {a.source}
              </span>
              <span className="font-mono text-muted" style={{ fontSize: 7.5, letterSpacing: "0.12em" }}>
                {timeAgo(a.published)}
              </span>
            </div>
            <p
              className="font-display uppercase text-bone group-hover:text-silver transition-colors leading-snug"
              style={{ fontSize: 17, lineHeight: 1.15 }}
            >
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
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="font-mono uppercase text-muted hover:text-bone transition-colors w-full text-center"
          style={{ padding: "14px 0", fontSize: 9, letterSpacing: "0.18em" }}
        >
          Load More
        </button>
      )}
    </div>
  );
}

// ── Week navigator ─────────────────────────────────────────────────────────────

function WeekNav({ week, dateRange, onChange }: {
  week: number; dateRange: string; onChange: (w: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <Button iconOnly aria-label="Previous week" onClick={() => onChange(Math.max(1, week - 1))} disabled={week <= 1}>‹</Button>
      <div className="text-center" style={{ minWidth: 96 }}>
        <div className="font-display uppercase text-bone" style={{ fontSize: 26, lineHeight: 1 }}>Wk {week}</div>
        {dateRange && (
          <div className="font-mono uppercase text-muted mt-1" style={{ fontSize: 8.5, letterSpacing: "0.14em" }}>{dateRange}</div>
        )}
      </div>
      <Button iconOnly aria-label="Next week" onClick={() => onChange(Math.min(NFL_TOTAL_WEEKS, week + 1))} disabled={week >= NFL_TOTAL_WEEKS}>›</Button>
    </div>
  );
}

// ── Standings ─────────────────────────────────────────────────────────────────

function StandingRow({ entry, showSeed, seed }: {
  entry: NFLStandingEntry; showSeed?: boolean; seed?: number;
}) {
  const logo   = entry.team.logos?.[0]?.href;
  const wins   = getStat(entry, "wins")?.displayValue    ?? "–";
  const losses = getStat(entry, "losses")?.displayValue  ?? "–";
  const ties   = getStat(entry, "ties")?.value ?? 0;
  const pct    = getStat(entry, "winPercent")?.displayValue ?? "–";
  const pf     = getStat(entry, "pointsFor")?.displayValue  ?? "–";
  const strk   = getStat(entry, "streak")?.displayValue   ?? "–";
  const record = `${wins}-${losses}${ties > 0 ? `-${ties}` : ""}`;

  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: showSeed ? "26px 1fr 52px 36px 36px 36px" : "1fr 52px 36px 36px 36px",
        gap: 6,
        padding: "7px 0",
        borderBottom: "1px solid var(--color-hairline)",
      }}
    >
      {showSeed && (
        <span className="font-mono text-muted text-right tabular-nums" style={{ fontSize: 9 }}>{seed}</span>
      )}
      <div className="flex items-center gap-2 min-w-0">
        <TeamCrest src={logo} name={entry.team.displayName} abbreviation={entry.team.abbreviation} size={16} />
        <span className="font-display uppercase text-bone truncate" style={{ fontSize: 16, lineHeight: 1 }}>
          {entry.team.shortDisplayName}
        </span>
      </div>
      <span className="font-mono text-silver tabular-nums" style={{ fontSize: 10 }}>{record}</span>
      <span className="font-mono text-muted text-right tabular-nums" style={{ fontSize: 9 }}>{pct}</span>
      <span className="font-mono text-muted text-right tabular-nums" style={{ fontSize: 9 }}>{pf}</span>
      <span className={`font-mono text-right tabular-nums ${strk.startsWith("W") ? "text-up" : "text-down"}`} style={{ fontSize: 9 }}>{strk}</span>
    </div>
  );
}

function StandingsHeader({ showSeed }: { showSeed?: boolean }) {
  return (
    <div
      className="grid font-mono uppercase text-muted pb-[8px]"
      style={{
        gridTemplateColumns: showSeed ? "26px 1fr 52px 36px 36px 36px" : "1fr 52px 36px 36px 36px",
        gap: 6,
        fontSize: 8,
        letterSpacing: "0.14em",
        borderBottom: "1px solid var(--color-hairline)",
      }}
    >
      {showSeed && <span>#</span>}
      <span>Team</span>
      <span>W-L</span>
      <span className="text-right">PCT</span>
      <span className="text-right">PF</span>
      <span className="text-right">STK</span>
    </div>
  );
}

function DivisionStandings({ conference }: { conference: NFLConference }) {
  const divisions = groupByDivision(conference.entries, conference.shortName);
  return (
    <div className="space-y-[22px]">
      {divisions.map(({ divName, entries }) => (
        <div key={divName}>
          <div className="font-mono uppercase text-signal mb-[10px]" style={{ fontSize: 9, letterSpacing: "0.18em" }}>
            {divName}
          </div>
          <StandingsHeader />
          {entries.map((e) => <StandingRow key={e.team.id} entry={e} />)}
        </div>
      ))}
    </div>
  );
}

function ConferenceStandings({ conference }: { conference: NFLConference }) {
  const sorted = [...conference.entries].sort(
    (a, b) => (getStat(a, "playoffSeed")?.value ?? 99) - (getStat(b, "playoffSeed")?.value ?? 99),
  );
  return (
    <div>
      <StandingsHeader showSeed />
      {sorted.map((e, i) => (
        <StandingRow key={e.team.id} entry={e} showSeed seed={i + 1} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type StandingsView = "division" | "conference";
type ConfTab = "AFC" | "NFC";

export default function NFLDashboard() {
  const [week,         setWeek]         = useState<number>(1);
  const [season,       setSeason]       = useState<number>(new Date().getFullYear());
  const [games,        setGames]        = useState<NFLGame[]>([]);
  const [dateRange,    setDateRange]    = useState("");
  const [leagueLogo,   setLeagueLogo]   = useState<string | null>(null);
  const [conferences,  setConferences]  = useState<NFLConference[]>([]);
  const [standView,    setStandView]    = useState<StandingsView>("division");
  const [confTab,      setConfTab]      = useState<ConfTab>("AFC");
  const [news,         setNews]         = useState<NFLArticle[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingStd,   setLoadingStd]   = useState(true);
  const [loadingNews,  setLoadingNews]  = useState(true);
  const [errorGames,   setErrorGames]   = useState(false);
  const [errorStd,     setErrorStd]     = useState(false);
  const [initialized,  setInitialized]  = useState(false);

  // Initial load: get current week from API
  useEffect(() => {
    setLoadingGames(true);
    fetchNFLScoreboard()
      .then(({ week: w, season: s, games: g, leagueLogo: logo }) => {
        setWeek(w);
        setSeason(s);
        setGames(g);
        setDateRange(weekDateRange(g));
        if (logo) setLeagueLogo(logo);
        setInitialized(true);
      })
      .catch(() => { setErrorGames(true); setInitialized(true); })
      .finally(() => setLoadingGames(false));

    fetchNFLStandings()
      .then(setConferences)
      .catch(() => setErrorStd(true))
      .finally(() => setLoadingStd(false));

    fetchNFLNews()
      .then(setNews)
      .finally(() => setLoadingNews(false));
  }, []);

  // Week change after initialization
  useEffect(() => {
    if (!initialized) return;
    setLoadingGames(true);
    setErrorGames(false);
    fetchNFLScoreboard(week)
      .then(({ season: s, games: g }) => {
        setSeason(s);
        setGames(g);
        setDateRange(weekDateRange(g));
      })
      .catch(() => setErrorGames(true))
      .finally(() => setLoadingGames(false));
  }, [week, initialized]);

  const liveCount  = games.filter((g) => g.competitions[0].status.type.state === "in").length;
  const activeConf = conferences.find((c) => c.shortName === confTab);

  return (
    <PageContainer>
      <PageHeader
        leading={leagueLogo && <img src={leagueLogo} alt="NFL" style={{ width: 52, height: 52, objectFit: "contain" }} />}
        eyebrow={<Eyebrow signal className="mb-2.5">NFL</Eyebrow>}
        title={`${season} Season`}
        actions={
          <>
            {liveCount > 0 && (
              <div className="label-caps flex items-center gap-1.5 text-signal">
                <StatusDot state="wire" />
                {liveCount} live
              </div>
            )}
            <WeekNav week={week} dateRange={dateRange} onChange={setWeek} />
          </>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_452px]">
        {/* Left: Scoreboard */}
        <div className="py-[26px] lg:pr-[34px]">
          <SectionLabel className="mb-5">Week {week} · {games.length} Games</SectionLabel>

          {loadingGames ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : errorGames ? (
            <p className="empty-state">Couldn't load games.</p>
          ) : games.length === 0 ? (
            <p className="empty-state">No games scheduled this week.</p>
          ) : (
            <div>
              {games.map((g) => <GameRow key={g.id} game={g} />)}
            </div>
          )}

          {/* News */}
          {!loadingNews && news.length > 0 && (
            <div className="mt-10">
              <SectionLabel className="mb-4">News</SectionLabel>
              <NewsList articles={news} />
            </div>
          )}
          {loadingNews && (
            <div className="mt-10 space-y-3">
              <SectionLabel className="mb-4">News</SectionLabel>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={68} />)}
            </div>
          )}
        </div>

        {/* Right: Standings */}
        <aside className="border-t border-hairline py-[26px] lg:border-l lg:border-t-0 lg:pl-[26px]">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <SectionLabel>Standings</SectionLabel>
            <div className="ml-auto flex items-center gap-2">
              <SegmentedControl
                label="Standings view"
                value={standView}
                onChange={setStandView}
                items={[
                  { value: "division",   label: "Division" },
                  { value: "conference", label: "Conference" },
                ]}
              />
            </div>
          </div>

          {/* Conference tabs */}
          <div className="flex gap-[1px] mb-5" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
            {(["AFC", "NFC"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setConfTab(c)}
                className="font-display uppercase pb-[9px] px-3 transition-colors"
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  color: confTab === c ? "var(--color-bone)" : "var(--color-muted)",
                  borderBottom: confTab === c ? "2px solid var(--color-signal)" : "2px solid transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  marginBottom: -1,
                  background: "none",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {loadingStd ? (
            <div className="space-y-2">
              {Array.from({ length: 16 }).map((_, i) => <Skeleton key={i} height={30} />)}
            </div>
          ) : errorStd ? (
            <p className="empty-state">Couldn't load standings.</p>
          ) : activeConf ? (
            standView === "division"
              ? <DivisionStandings conference={activeConf} />
              : <ConferenceStandings conference={activeConf} />
          ) : null}
        </aside>
      </div>
    </PageContainer>
  );
}
