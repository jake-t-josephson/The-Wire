-- ─────────────────────────────────────────────────
-- The Wire — EPL schema
-- Apply in Supabase dashboard → SQL Editor
-- ─────────────────────────────────────────────────

-- Teams
create table if not exists teams (
  id           bigint primary key generated always as identity,
  league       text        not null default 'epl',
  api_id       integer     not null,
  name         text        not null,
  short_name   text,
  crest_url    text,
  colors       jsonb,
  created_at   timestamptz not null default now(),
  constraint teams_league_api_id_key unique (league, api_id)
);

-- Fixtures
create table if not exists fixtures (
  id              bigint primary key generated always as identity,
  league          text        not null default 'epl',
  api_id          integer     not null unique,
  season          integer     not null,
  round           text,
  home_team_id    bigint      references teams(id),
  away_team_id    bigint      references teams(id),
  kickoff         timestamptz,
  status          text        not null default 'scheduled',
  home_score      integer,
  away_score      integer,
  venue           text,
  referee         text,
  raw             jsonb,       -- full api-sports response for future use
  updated_at      timestamptz not null default now()
);

create index if not exists fixtures_league_season_idx on fixtures(league, season);
create index if not exists fixtures_kickoff_idx on fixtures(kickoff);
create index if not exists fixtures_home_team_idx on fixtures(home_team_id);
create index if not exists fixtures_away_team_idx on fixtures(away_team_id);

-- Standings
create table if not exists standings (
  id              bigint primary key generated always as identity,
  league          text        not null default 'epl',
  season          integer     not null,
  team_id         bigint      not null references teams(id),
  position        integer     not null,
  played          integer     not null default 0,
  won             integer     not null default 0,
  drawn           integer     not null default 0,
  lost            integer     not null default 0,
  goals_for       integer     not null default 0,
  goals_against   integer     not null default 0,
  goal_diff       integer     not null default 0,
  points          integer     not null default 0,
  form            text,
  updated_at      timestamptz not null default now(),
  constraint standings_league_season_team_key unique (league, season, team_id)
);

create index if not exists standings_league_season_idx on standings(league, season, position);

-- Top scorers
create table if not exists top_scorers (
  id              bigint primary key generated always as identity,
  league          text        not null default 'epl',
  season          integer     not null,
  player_api_id   integer     not null,
  player_name     text        not null,
  team_id         bigint      references teams(id),
  goals           integer     not null default 0,
  assists         integer     not null default 0,
  appearances     integer     not null default 0,
  updated_at      timestamptz not null default now(),
  constraint top_scorers_league_season_player_key unique (league, season, player_api_id)
);

-- News items (RSS / scraped)
create table if not exists news_items (
  id              bigint primary key generated always as identity,
  league          text,        -- null = cross-league
  title           text        not null,
  url             text        not null unique,
  source          text        not null,
  summary         text,
  image_url       text,
  published_at    timestamptz,
  fetched_at      timestamptz not null default now()
);

create index if not exists news_items_league_idx on news_items(league, published_at desc);

-- Sync log — track last successful pull per feed
create table if not exists sync_log (
  id          bigint primary key generated always as identity,
  feed        text        not null,
  synced_at   timestamptz not null default now(),
  status      text        not null default 'ok',  -- 'ok' | 'error'
  message     text
);

create index if not exists sync_log_feed_idx on sync_log(feed, synced_at desc);
