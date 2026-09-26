import { CFB_TOTAL_WEEKS } from "../../lib/cfb";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { StatusDot } from "../../components/sports/StatusDot";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Eyebrow, SectionLabel } from "../../components/ui/Typography";
import { CFB_SOURCE_META } from "../../lib/sourceMeta";
import { PeriodNavigator } from "../../components/sports/PeriodNavigator";
import { NewsFeed } from "../../components/sports/NewsFeed";
import { SportDashboardLayout, SportDashboardMain, SportDashboardRail } from "../../components/layout/SportDashboardLayout";
import { GameRow } from "../../components/sports/GameRow";
import { toCFBGameRow } from "../../lib/adapters/cfb";
import { useCFBDashboard, type CFBDashboardModel, type CFBView } from "../../features/cfb/useCFBDashboard";
import type { NewsArticleModel } from "../../components/sports/NewsFeed";
import { SegmentedControl } from "../../components/ui/SegmentedControl";

const VIEWS: Array<{ value: CFBView; label: string }> = [
  { value: "sec",   label: "SEC" },
  { value: "big10", label: "Big Ten" },
  { value: "top25", label: "Top 25" },
];

export default function CFBDashboard() {
  return <CFBDashboardView model={useCFBDashboard()} />;
}

export function CFBDashboardView({ model }: { model: CFBDashboardModel }) {
  const {
    changeView,
    changeWeek,
    dateRange,
    days,
    games,
    gamesError,
    leagueLogo,
    liveCount,
    loadingGames,
    loadingNews,
    loadingRankings,
    news,
    rankings,
    rankingsMode,
    season,
    setRankingsMode,
    view,
    week,
  } = model;

  return (
    <PageContainer>
      <PageHeader
        leading={leagueLogo && <img className="league-mark" src={leagueLogo} alt="College Football" />}
        eyebrow={<Eyebrow signal className="mb-2.5">College Football</Eyebrow>}
        title={`${season} Season`}
        actions={
          <>
            {liveCount > 0 && (
              <div className="label-caps flex items-center gap-1.5 text-signal">
                <StatusDot state="wire" />
                {liveCount} live
              </div>
            )}
            <PeriodNavigator
              label={`Wk ${week}`}
              detail={dateRange}
              previousLabel="Previous week"
              nextLabel="Next week"
              onPrevious={() => changeWeek(Math.max(1, week - 1))}
              onNext={() => changeWeek(Math.min(CFB_TOTAL_WEEKS, week + 1))}
              previousDisabled={week <= 1}
              nextDisabled={week >= CFB_TOTAL_WEEKS}
            />
          </>
        }
      />

      {/* Conference / view tabs */}
      <div className="conference-tabs">
        {VIEWS.map(({ value, label }) => (
          <Button
            key={value}
            variant="bare"
            className="conference-tabs__item"
            data-active={view === value || undefined}
            aria-pressed={view === value}
            onClick={() => changeView(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <SportDashboardLayout>
        {/* Left: Scoreboard */}
        <SportDashboardMain>
          <SectionLabel className="mb-5">
            Week {week} · {games.length} Games
          </SectionLabel>

          {loadingGames ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : gamesError ? (
            <p className="empty-state">Couldn't load games.</p>
          ) : games.length === 0 ? (
            <p className="empty-state">No games scheduled this week.</p>
          ) : (
            <div>
              {days.map(({ label, games: dayGames }) => (
                <div key={label}>
                  <div className="eyebrow eyebrow--signal mb-3 mt-[22px]">{label}</div>
                  <div className="games-grid">
                    {dayGames.map((game) => <GameRow key={game.id} game={toCFBGameRow(game)} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingNews && news.length > 0 && (
            <div className="mt-10">
              <SectionLabel className="mb-4">News</SectionLabel>
              <NewsFeed
                articles={news.map((a): NewsArticleModel => ({ headline: a.headline, description: a.description, published: a.published, url: a.links.web.href, source: "ESPN" }))}
                sources={CFB_SOURCE_META}
              />
            </div>
          )}
          {loadingNews && (
            <div className="mt-10 space-y-3">
              <SectionLabel className="mb-4">News</SectionLabel>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={68} />)}
            </div>
          )}
        </SportDashboardMain>

        {/* Right: Top 25 rankings */}
        <SportDashboardRail>
          <div className="mb-[18px] flex items-center gap-3">
            <SectionLabel>AP Top 25</SectionLabel>
            <div className="ml-auto">
              <SegmentedControl
                label="Rankings view"
                value={rankingsMode}
                onChange={setRankingsMode}
                items={[
                  { value: "snapshot", label: `Wk ${week}`, disabled: rankings.length === 0 && rankingsMode !== "snapshot" },
                  { value: "live", label: "Live" },
                ]}
              />
            </div>
          </div>

          {loadingRankings ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} height={33} />)}
            </div>
          ) : rankings.length === 0 ? (
            <p className="empty-state">Rankings unavailable.</p>
          ) : (
            <div className="cfb-rankings">
              {rankings.map((entry) => {
                const moved = entry.previousRank ? entry.previousRank - entry.rank : 0;
                return (
                  <div key={entry.team.id} className="cfb-ranking-row">
                    <span className="cfb-ranking-row__rank">{entry.rank}</span>
                    <img className="cfb-ranking-row__crest" src={entry.team.logo} alt="" aria-hidden="true" />
                    <span className="cfb-ranking-row__name">{entry.team.shortDisplayName}</span>
                    <span className="cfb-ranking-row__record">{entry.record ?? ""}</span>
                    <small className="cfb-ranking-row__move" data-tone={moved > 0 ? "positive" : moved < 0 ? "negative" : undefined}>
                      {moved > 0 ? `▲${moved}` : moved < 0 ? `▼${Math.abs(moved)}` : "—"}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
        </SportDashboardRail>
      </SportDashboardLayout>
    </PageContainer>
  );
}
