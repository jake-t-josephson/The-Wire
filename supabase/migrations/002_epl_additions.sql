-- ─────────────────────────────────────────────────
-- The Wire — EPL additions
-- Apply in Supabase dashboard → SQL Editor
-- ─────────────────────────────────────────────────

-- Add matchweek column to fixtures
alter table fixtures add column if not exists matchweek integer;

-- Historical standings snapshot after each matchweek completes
create table if not exists standings_snapshots (
  id            bigint primary key generated always as identity,
  league        text        not null default 'epl',
  season        integer     not null,
  matchweek     integer     not null,
  team_id       bigint      not null references teams(id),
  position      integer     not null,
  played        integer     not null default 0,
  won           integer     not null default 0,
  drawn         integer     not null default 0,
  lost          integer     not null default 0,
  goals_for     integer     not null default 0,
  goals_against integer     not null default 0,
  goal_diff     integer     not null default 0,
  points        integer     not null default 0,
  snapshotted_at timestamptz not null default now(),
  constraint standings_snapshots_unique unique (league, season, matchweek, team_id)
);

create index if not exists standings_snapshots_lookup_idx
  on standings_snapshots(league, season, matchweek);

-- Per-team match stats for each finished fixture
create table if not exists match_stats (
  id              bigint primary key generated always as identity,
  fixture_id      bigint      not null references fixtures(id),
  team_id         bigint      not null references teams(id),
  is_home         boolean     not null,
  possession      numeric(4,1),
  shots           integer,
  shots_on_target integer,
  saves           integer,
  corners         integer,
  fouls           integer,
  yellow_cards    integer,
  red_cards       integer,
  offsides        integer,
  constraint match_stats_unique unique (fixture_id, team_id)
);

create index if not exists match_stats_fixture_idx on match_stats(fixture_id);
