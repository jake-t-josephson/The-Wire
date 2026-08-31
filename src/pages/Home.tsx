import { useState, useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  fetchFixtures, fetchStandings, fetchNews,
  groupMatchweeks, currentMatchweekIndex,
  type ESPNFixture, type ESPNStandingEntry, type ESPNArticle,
} from "../lib/espn";
import { fetchWireroom } from "../lib/supabase";
import type { WireroomBrief, WireroomSection } from "../lib/articles";
import { StatusDot } from "../components/sports/StatusDot";
import { TeamCrest } from "../components/sports/TeamCrest";
import { Skeleton } from "../components/ui/Skeleton";

// ── Live rail ─────────────────────────────────────────────────────────────────

function LiveCard({ fixture }: { fixture: ESPNFixture }) {
  const comp   = fixture.competitions[0];
  const status = comp.status.type;
  const home   = comp.competitors.find((c) => c.homeAway === "home")!;
  const away   = comp.competitors.find((c) => c.homeAway === "away")!;
  const isLive = status.state === "in";
  const isDone = status.state === "post";
  const clock  = comp.status.displayClock;
  const isWire = isLive && parseInt(clock) >= 88;

  const teamClass = (winner: boolean) =>
    `live-card__team-name${isDone && !winner ? " live-card__team-name--dim" : ""}`;
  const scoreClass = (winner: boolean) =>
    `live-card__score${isDone && !winner ? " live-card__score--dim" : ""}`;

  return (
    <Link className="live-card" to={`/epl/match/${fixture.id}`} aria-label={`${home.team.displayName} vs ${away.team.displayName}`}>
      {isLive && <div className="live-card__bar" />}

      <div className="live-card__header" style={{ marginLeft: isLive ? 8 : 0 }}>
        <StatusDot state={isLive ? (isWire ? "wire" : "live") : "final"} />
        <span className="live-card__clock">{isLive ? clock : "Final"}</span>
        <span className="live-card__league-tag">PL</span>
      </div>

      <div className="live-card__teams" style={{ marginLeft: isLive ? 8 : 0 }}>
        {[{ c: home, win: home.winner }, { c: away, win: away.winner }].map(({ c, win }) => (
          <div key={c.homeAway} className="live-card__team">
            <TeamCrest src={c.team.logo} name={c.team.displayName} abbreviation={c.team.abbreviation} size={20} />
            <span className={teamClass(!!win)}>{c.team.shortDisplayName}</span>
            <span className={scoreClass(!!win)}>{c.score}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function LiveRail({ fixtures }: { fixtures: ESPNFixture[] }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const cols = Math.min(fixtures.length, 4);

  return (
    <div className="live-rail">
      <div className="live-rail__inner">
        <div className="live-rail__header">
          <span className="live-rail__badge">Live now</span>
          <span className="live-rail__meta">{dateLabel} · {timeLabel}</span>
          <span className="live-rail__count">{fixtures.length} game{fixtures.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="live-rail__games" style={{ "--live-columns": cols } as CSSProperties}>
          {fixtures.slice(0, 4).map((f) => <LiveCard key={f.id} fixture={f} />)}
        </div>
      </div>
    </div>
  );
}

// ── Wireroom block ────────────────────────────────────────────────────────────

function WireroomBlock({
  brief, fallbackArticles, loading,
}: {
  brief: WireroomBrief | null;
  fallbackArticles: ESPNArticle[];
  loading: boolean;
}) {
  const time = brief
    ? new Date(brief.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : fallbackArticles[0]
    ? new Date(fallbackArticles[0].published).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  const sourceCount = brief?.sourceCount ?? (fallbackArticles.length > 0 ? 1 : 0);

  return (
    <div>
      <div className="wireroom__header">
        <div className="wireroom__sq" />
        <span className="wireroom__label">Wireroom</span>
        {!loading && sourceCount > 0 && (
          <span className="wireroom__source-count">
            assembled from {sourceCount} source{sourceCount !== 1 ? "s" : ""}, {time}
          </span>
        )}
        <div className="wireroom__rule" />
        <span className="wireroom__league-tag">Premier League</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton height={200} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </div>
      ) : brief ? (
        <BriefView brief={brief} />
      ) : fallbackArticles.length > 0 ? (
        <FallbackView articles={fallbackArticles} />
      ) : null}
    </div>
  );
}

function BriefSection({ section }: { section: WireroomSection }) {
  return (
    <div className="wireroom__section">
      <div className="wireroom__section-theme">{section.theme}</div>
      <div className="wireroom__section-heading">{section.heading}</div>
      <p className="wireroom__section-body">{section.body}</p>
      {section.links.length > 0 && (
        <div className="wireroom__section-links">
          {section.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="wireroom__section-link">
              {l.label} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function BriefView({ brief }: { brief: WireroomBrief }) {
  return (
    <div className="wireroom__article">
      <div className="wireroom__article-title">{brief.title}</div>
      {brief.sections.map((s, i) => (
        <BriefSection key={i} section={s} />
      ))}
    </div>
  );
}

function FallbackView({ articles }: { articles: ESPNArticle[] }) {
  return (
    <div className="wireroom__article">
      <div className="wireroom__article-title">THIS WEEK IN THE PREMIER LEAGUE</div>
      <div className="wireroom__section">
        <div className="wireroom__section-theme">Latest</div>
        <div className="wireroom__section-heading">FROM THE WIRE</div>
        <div className="wireroom__section-links">
          {articles.slice(0, 8).map((a, i) => (
            <a key={i} href={a.links.web.href} target="_blank" rel="noopener noreferrer" className="wireroom__section-link">
              {a.headline} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Column section ────────────────────────────────────────────────────────────

function ColumnSection() {
  return (
    <div className="column-section">
      <div className="column-section__header">
        <span className="column-section__label">The Column</span>
        <div className="column-section__rule" />
        <span className="column-section__tag">Weekly</span>
      </div>
      <p className="column-section__placeholder">
        The Column is coming soon — a place for long-form writing about what actually happened.
      </p>
    </div>
  );
}

// ── Today's slate ─────────────────────────────────────────────────────────────

function TodaySlate({ fixtures }: { fixtures: ESPNFixture[] }) {
  return (
    <div>
      <div className="slate-header">Today's slate</div>
      <div>
        {fixtures.slice(0, 8).map((f) => {
          const comp   = f.competitions[0];
          const home   = comp.competitors.find((c) => c.homeAway === "home")!;
          const away   = comp.competitors.find((c) => c.homeAway === "away")!;
          const { type: status, displayClock } = comp.status;
          const isDone = status.state === "post";
          const isLive = status.state === "in";
          const time   = isDone ? "FT"
            : isLive ? displayClock
            : new Date(f.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

          return (
            <Link key={f.id} className="slate-row" to={`/epl/match/${f.id}`}>
              <span className="slate-row__time">{time}</span>
              <span className="slate-row__teams">
                {home.team.shortDisplayName} · {away.team.shortDisplayName}
              </span>
              <span className="slate-row__league">PL</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Wire separator ────────────────────────────────────────────────────────────

function WireSeparator() {
  return (
    <div className="wire-sep">
      <div className="wire-sep__dot" />
    </div>
  );
}

// ── Mini standings ────────────────────────────────────────────────────────────

function MiniStandings({ entries, gwLabel }: { entries: ESPNStandingEntry[]; gwLabel: string }) {
  return (
    <div>
      <div className="standings-mini__label">Premier League · {gwLabel}</div>

      <div className="standings-mini__col-heads">
        <span>#</span><span>Club</span><span>GD</span><span>Pts</span>
      </div>

      {entries.slice(0, 4).map((entry, i) => {
        const pos = parseInt(entry.stats.find((s) => s.name === "rank")?.displayValue ?? "") || i + 1;
        const gd  = entry.stats.find((s) => s.name === "pointDifferential")?.displayValue ?? "–";
        const pts = entry.stats.find((s) => s.name === "points")?.displayValue ?? "–";

        return (
          <Link
            key={entry.team.id}
            className="standings-mini__row"
            to={`/epl/team/${entry.team.id}`}
          >
            <span className={`standings-mini__pos${pos === 1 ? " standings-mini__pos--first" : ""}`}>
              {pos}
            </span>
            <span className="standings-mini__club">{entry.team.shortDisplayName}</span>
            <span className="standings-mini__gd">{gd}</span>
            <span className="standings-mini__pts">{pts}</span>
          </Link>
        );
      })}

      <Link to="/epl" className="standings-mini__link">Full table →</Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [fixtures,         setFixtures]         = useState<ESPNFixture[]>([]);
  const [standings,        setStandings]        = useState<ESPNStandingEntry[]>([]);
  const [gwLabel,          setGwLabel]          = useState("GW1");
  const [loadingData,      setLoadingData]      = useState(true);

  // Wireroom loads separately — may call Claude if cache is cold
  const [brief,            setBrief]            = useState<WireroomBrief | null>(null);
  const [fallbackArticles, setFallbackArticles] = useState<ESPNArticle[]>([]);
  const [loadingWireroom,  setLoadingWireroom]  = useState(true);

  useEffect(() => {
    // Fast: fixtures + standings
    Promise.all([fetchFixtures(), fetchStandings()])
      .then(([{ fixtures: f, calendar }, s]) => {
        setFixtures(f);
        setStandings(s);
        const weeks = groupMatchweeks(calendar);
        const idx   = currentMatchweekIndex(weeks);
        if (weeks[idx]) setGwLabel(weeks[idx].label);
      })
      .finally(() => setLoadingData(false));

    // Slower: AI wireroom brief, fallback to ESPN raw articles
    fetchWireroom()
      .then((b) => {
        if (b) { setBrief(b); return; }
        return fetchNews().then(setFallbackArticles);
      })
      .catch(() => fetchNews().then(setFallbackArticles))
      .finally(() => setLoadingWireroom(false));
  }, []);

  const liveGames = fixtures.filter((f) => f.competitions[0].status.type.state === "in");

  return (
    <>
      {liveGames.length > 0 && <LiveRail fixtures={liveGames} />}

      <div className="home-grid">
        <div className="home-editorial">
          <WireroomBlock
            brief={brief}
            fallbackArticles={fallbackArticles}
            loading={loadingWireroom}
          />
          <ColumnSection />
        </div>

        <div className="home-sidebar">
          {loadingData ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} height={34} />)}
            </div>
          ) : (
            <>
              <TodaySlate fixtures={fixtures} />
              <WireSeparator />
              <MiniStandings entries={standings} gwLabel={gwLabel} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
