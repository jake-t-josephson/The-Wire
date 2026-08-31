-- ── Podcast feeds ─────────────────────────────────────────────────────────────

create table podcast_feeds (
  id             uuid primary key default gen_random_uuid(),
  feed_url       text not null unique,
  title          text,
  artwork_url    text,
  last_fetched_at timestamptz,
  created_at     timestamptz default now()
);

alter table podcast_feeds enable row level security;
create policy "anon read"     on podcast_feeds for select using (true);
create policy "service write" on podcast_feeds for all    using (auth.role() = 'service_role');

-- ── Podcast episodes ──────────────────────────────────────────────────────────

create table podcast_episodes (
  guid             text primary key,
  feed_id          uuid references podcast_feeds(id) on delete cascade,
  title            text not null,
  description      text,
  enclosure_url    text not null,
  duration_seconds integer,
  pub_date         timestamptz,
  artwork_url      text,
  created_at       timestamptz default now()
);

create index podcast_episodes_feed_date on podcast_episodes (feed_id, pub_date desc);

alter table podcast_episodes enable row level security;
create policy "anon read"     on podcast_episodes for select using (true);
create policy "service write" on podcast_episodes for all    using (auth.role() = 'service_role');

-- ── Playback progress ─────────────────────────────────────────────────────────

create table podcast_progress (
  episode_guid     text primary key references podcast_episodes(guid) on delete cascade,
  position_seconds integer     not null default 0,
  completed        boolean     not null default false,
  last_played_at   timestamptz default now()
);

alter table podcast_progress enable row level security;
-- Progress is personal — anon can read/write their own session data
create policy "anon read"  on podcast_progress for select using (true);
create policy "anon write" on podcast_progress for all    using (true);

-- ── Seed feeds ────────────────────────────────────────────────────────────────

insert into podcast_feeds (feed_url) values
  ('https://feeds.acast.com/public/shows/685af115f42ce0122448ce47'),
  ('https://feeds.acast.com/public/shows/6818cd43eb146d8e35d312c7'),
  ('https://feeds.acast.com/public/shows/6818be7d1d28d62313ac8ef3'),
  ('https://feeds.acast.com/public/shows/681cccd63e6644d7a3b3065c');
