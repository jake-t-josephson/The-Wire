import { Link } from "react-router-dom";
import type { ESPNArticle, ESPNFixture, ESPNStandingEntry } from "../../lib/espn";
import type { WireroomBrief, WireroomSection } from "../../lib/articles";
import { StatusDot } from "../../components/sports/StatusDot";
import { TeamCrest } from "../../components/sports/TeamCrest";
import { Skeleton } from "../../components/ui/Skeleton";

function LiveCard({ fixture }: { fixture: ESPNFixture }) {
  const competition = fixture.competitions[0];
  const status = competition.status.type;
  const home = competition.competitors.find((team) => team.homeAway === "home")!;
  const away = competition.competitors.find((team) => team.homeAway === "away")!;
  const live = status.state === "in";
  const done = status.state === "post";
  const clock = competition.status.displayClock;
  const wire = live && parseInt(clock) >= 88;
  const teamClass = (winner: boolean) => `live-card__team-name${done && !winner ? " live-card__team-name--dim" : ""}`;
  const scoreClass = (winner: boolean) => `live-card__score${done && !winner ? " live-card__score--dim" : ""}`;
  return (
    <Link className="live-card" to={`/epl/match/${fixture.id}`} aria-label={`${home.team.displayName} vs ${away.team.displayName}`}>
      {live && <div className="live-card__bar" />}
      <div className="live-card__header" data-live={live || undefined}>
        <StatusDot state={live ? (wire ? "wire" : "live") : "final"} />
        <span className="live-card__clock">{live ? clock : "Final"}</span>
        <span className="live-card__league-tag">PL</span>
      </div>
      <div className="live-card__teams" data-live={live || undefined}>
        {[home, away].map((competitor) => (
          <div key={competitor.homeAway} className="live-card__team">
            <TeamCrest src={competitor.team.logo} name={competitor.team.displayName} abbreviation={competitor.team.abbreviation} size={20} />
            <span className={teamClass(!!competitor.winner)}>{competitor.team.shortDisplayName}</span>
            <span className={scoreClass(!!competitor.winner)}>{competitor.score}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

export function LiveRail({ fixtures }: { fixtures: ESPNFixture[] }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const columns = Math.min(fixtures.length, 4);
  return (
    <div className="live-rail">
      <div className="live-rail__inner">
        <div className="live-rail__header">
          <span className="live-rail__badge">Live now</span>
          <span className="live-rail__meta">{dateLabel} · {timeLabel}</span>
          <span className="live-rail__count">{fixtures.length} game{fixtures.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="live-rail__games" data-columns={columns}>{fixtures.slice(0, 4).map((fixture) => <LiveCard key={fixture.id} fixture={fixture} />)}</div>
      </div>
    </div>
  );
}

function BriefSection({ section }: { section: WireroomSection }) {
  return (
    <div className="wireroom__section">
      <div className="wireroom__section-theme">{section.theme}</div>
      <div className="wireroom__section-heading">{section.heading}</div>
      <p className="wireroom__section-body">{section.body}</p>
      {section.links.length > 0 && <div className="wireroom__section-links">{section.links.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="wireroom__section-link">{link.label} →</a>
      ))}</div>}
    </div>
  );
}

function BriefView({ brief }: { brief: WireroomBrief }) {
  return <div className="wireroom__article"><div className="wireroom__article-title">{brief.title}</div>{brief.sections.map((section) => <BriefSection key={`${section.theme}-${section.heading}`} section={section} />)}</div>;
}

function FallbackView({ articles }: { articles: ESPNArticle[] }) {
  return (
    <div className="wireroom__article">
      <div className="wireroom__article-title">THIS WEEK IN THE PREMIER LEAGUE</div>
      <div className="wireroom__section">
        <div className="wireroom__section-theme">Latest</div>
        <div className="wireroom__section-heading">FROM THE WIRE</div>
        <div className="wireroom__section-links">{articles.slice(0, 8).map((article) => (
          <a key={article.links.web.href} href={article.links.web.href} target="_blank" rel="noopener noreferrer" className="wireroom__section-link">{article.headline} →</a>
        ))}</div>
      </div>
    </div>
  );
}

export function WireroomBlock({ brief, fallbackArticles, loading }: { brief: WireroomBrief | null; fallbackArticles: ESPNArticle[]; loading: boolean }) {
  const time = brief ? new Date(brief.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : fallbackArticles[0] ? new Date(fallbackArticles[0].published).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const sourceCount = brief?.sourceCount ?? (fallbackArticles.length > 0 ? 1 : 0);
  return (
    <div>
      <div className="wireroom__header">
        <div className="wireroom__sq" /><span className="wireroom__label">Wireroom</span>
        {!loading && sourceCount > 0 && <span className="wireroom__source-count">assembled from {sourceCount} source{sourceCount !== 1 ? "s" : ""}, {time}</span>}
        <div className="wireroom__rule" /><span className="wireroom__league-tag">Premier League</span>
      </div>
      {loading ? <div className="space-y-4"><Skeleton height={200} /><Skeleton height={60} /><Skeleton height={60} /></div>
        : brief ? <BriefView brief={brief} /> : fallbackArticles.length > 0 ? <FallbackView articles={fallbackArticles} /> : null}
    </div>
  );
}

export function ColumnSection() {
  return <div className="column-section"><div className="column-section__header"><span className="column-section__label">The Column</span><div className="column-section__rule" /><span className="column-section__tag">Weekly</span></div><p className="column-section__placeholder">The Column is coming soon — a place for long-form writing about what actually happened.</p></div>;
}

function TodaySlate({ fixtures }: { fixtures: ESPNFixture[] }) {
  return <div><div className="slate-header">Today's slate</div><div>{fixtures.slice(0, 8).map((fixture) => {
    const competition = fixture.competitions[0];
    const home = competition.competitors.find((team) => team.homeAway === "home")!;
    const away = competition.competitors.find((team) => team.homeAway === "away")!;
    const { type: status, displayClock } = competition.status;
    const time = status.state === "post" ? "FT" : status.state === "in" ? displayClock : new Date(fixture.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return <Link key={fixture.id} className="slate-row" to={`/epl/match/${fixture.id}`}><span className="slate-row__time">{time}</span><span className="slate-row__teams">{home.team.shortDisplayName} · {away.team.shortDisplayName}</span><span className="slate-row__league">PL</span></Link>;
  })}</div></div>;
}

function MiniStandings({ entries, gameweek }: { entries: ESPNStandingEntry[]; gameweek: string }) {
  return (
    <div>
      <div className="standings-mini__label">Premier League · {gameweek}</div>
      <div className="standings-mini__col-heads"><span>#</span><span>Club</span><span>GD</span><span>Pts</span></div>
      {entries.slice(0, 4).map((entry, index) => {
        const stat = (name: string) => entry.stats.find((item) => item.name === name)?.displayValue ?? "–";
        const position = parseInt(stat("rank")) || index + 1;
        return <Link key={entry.team.id} className="standings-mini__row" to={`/epl/team/${entry.team.id}`}><span className={`standings-mini__pos${position === 1 ? " standings-mini__pos--first" : ""}`}>{position}</span><span className="standings-mini__club">{entry.team.shortDisplayName}</span><span className="standings-mini__gd">{stat("pointDifferential")}</span><span className="standings-mini__pts">{stat("points")}</span></Link>;
      })}
      <Link to="/epl" className="standings-mini__link">Full table →</Link>
    </div>
  );
}

export function HomeSidebar({ fixtures, standings, gameweek, loading }: { fixtures: ESPNFixture[]; standings: ESPNStandingEntry[]; gameweek: string; loading: boolean }) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} height={34} />)}</div>;
  return <><TodaySlate fixtures={fixtures} /><div className="wire-sep"><div className="wire-sep__dot" /></div><MiniStandings entries={standings} gameweek={gameweek} /></>;
}
