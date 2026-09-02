import { Link } from "react-router-dom";
import type { ESPNArticle } from "../../lib/espn";
import type { WireroomBrief, WireroomSection } from "../../lib/articles";
import type { CompactGameModel, CompactStandingModel } from "../../models/home";
import { StatusDot } from "../../components/sports/StatusDot";
import { TeamCrest } from "../../components/sports/TeamCrest";
import { Skeleton } from "../../components/ui/Skeleton";

function LiveCard({ game }: { game: CompactGameModel }) {
  const live = game.state === "live";
  const final = game.state === "final";
  const teamClass = (winner: boolean) => `live-card__team-name${final && !winner ? " live-card__team-name--dim" : ""}`;
  const scoreClass = (winner: boolean) => `live-card__score${final && !winner ? " live-card__score--dim" : ""}`;
  return (
    <Link className="live-card" to={game.href} aria-label={game.accessibleLabel}>
      {live && <div className="live-card__bar" />}
      <div className="live-card__header" data-live={live || undefined}>
        <StatusDot state={live ? (game.wire ? "wire" : "live") : "final"} />
        <span className="live-card__clock">{game.statusLabel}</span>
        <span className="live-card__league-tag">{game.leagueLabel}</span>
      </div>
      <div className="live-card__teams" data-live={live || undefined}>
        {game.teams.map((team) => (
          <div key={team.id} className="live-card__team">
            <TeamCrest src={team.crest} name={team.name} abbreviation={team.abbreviation} size={20} />
            <span className={teamClass(!!team.winner)}>{team.shortName}</span>
            <span className={scoreClass(!!team.winner)}>{team.score}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

export function LiveRail({ games }: { games: CompactGameModel[] }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const columns = Math.min(games.length, 4);
  return (
    <div className="live-rail">
      <div className="live-rail__inner">
        <div className="live-rail__header">
          <span className="live-rail__badge">Live now</span>
          <span className="live-rail__meta">{dateLabel} · {timeLabel}</span>
          <span className="live-rail__count">{games.length} game{games.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="live-rail__games" data-columns={columns}>{games.slice(0, 4).map((game) => <LiveCard key={game.id} game={game} />)}</div>
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

function TodaySlate({ games }: { games: CompactGameModel[] }) {
  return <div><div className="slate-header">Today's slate</div><div>{games.slice(0, 8).map((game) => (
    <Link key={game.id} className="slate-row" to={game.href} aria-label={game.accessibleLabel}><span className="slate-row__time">{game.statusLabel}</span><span className="slate-row__teams">{game.teams[0].shortName} · {game.teams[1].shortName}</span><span className="slate-row__league">{game.leagueLabel}</span></Link>
  ))}</div></div>;
}

function MiniStandings({ entries, gameweek }: { entries: CompactStandingModel[]; gameweek: string }) {
  return (
    <div>
      <div className="standings-mini__label">Premier League · {gameweek}</div>
      <div className="standings-mini__col-heads"><span>#</span><span>Club</span><span>GD</span><span>Pts</span></div>
      {entries.slice(0, 4).map((entry) => (
        <Link key={entry.id} className="standings-mini__row" to={entry.href}><span className={`standings-mini__pos${entry.position === 1 ? " standings-mini__pos--first" : ""}`}>{entry.position}</span><span className="standings-mini__club">{entry.teamName}</span><span className="standings-mini__gd">{entry.goalDifference}</span><span className="standings-mini__pts">{entry.points}</span></Link>
      ))}
      <Link to="/epl" className="standings-mini__link">Full table →</Link>
    </div>
  );
}

export function HomeSidebar({ games, standings, gameweek, loading }: { games: CompactGameModel[]; standings: CompactStandingModel[]; gameweek: string; loading: boolean }) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} height={34} />)}</div>;
  return <><TodaySlate games={games} /><div className="wire-sep"><div className="wire-sep__dot" /></div><MiniStandings entries={standings} gameweek={gameweek} /></>;
}
