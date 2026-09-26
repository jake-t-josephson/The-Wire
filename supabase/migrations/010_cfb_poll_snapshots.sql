create table cfb_poll_snapshots (
  id          bigserial primary key,
  season      int  not null,
  week        int  not null,
  rank        int  not null,
  team_espn_id text not null,
  team_name   text not null,
  team_abbr   text not null,
  team_logo   text,
  record      text,
  points      numeric,
  previous_rank int,
  created_at  timestamptz default now(),

  unique (season, week, team_espn_id)
);

alter table cfb_poll_snapshots enable row level security;

create policy "public read cfb poll snapshots"
  on cfb_poll_snapshots for select
  to anon, authenticated
  using (true);
