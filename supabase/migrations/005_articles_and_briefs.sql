-- Replace the simple single-row cache with a full historical record.

drop table if exists wireroom_cache;

-- ── Articles ──────────────────────────────────────────────────────────────────
-- Every article fetched from every source. URL is the natural dedup key.

create table if not exists articles (
  id           text primary key,           -- article URL
  source       text not null,              -- 'espn' | 'nyt' | 'athletic' | 'ringer'
  source_label text not null,              -- 'ESPN' | 'NY Times' | 'The Athletic' | 'The Ringer'
  league       text not null default 'epl',
  headline     text not null,
  description  text,
  url          text not null,
  published_at timestamptz not null,
  fetched_at   timestamptz not null default now()
);

create index articles_league_published on articles (league, published_at desc);
create index articles_source           on articles (source);

alter table articles enable row level security;

create policy "anon read"    on articles for select using (true);
create policy "service write" on articles for all    using (auth.role() = 'service_role');

-- ── Wireroom briefs ───────────────────────────────────────────────────────────
-- Full history of every AI-generated brief. article_ids references articles.id.

create table if not exists wireroom_briefs (
  id           uuid primary key default gen_random_uuid(),
  league       text not null,
  generated_at timestamptz not null default now(),
  lead_brief   jsonb not null,
  secondaries  jsonb not null,
  source_count int not null default 0,
  article_ids  text[] not null default '{}'
);

create index wireroom_briefs_league_generated on wireroom_briefs (league, generated_at desc);

alter table wireroom_briefs enable row level security;

create policy "anon read"    on wireroom_briefs for select using (true);
create policy "service write" on wireroom_briefs for all    using (auth.role() = 'service_role');
