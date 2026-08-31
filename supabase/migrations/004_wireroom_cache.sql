create table if not exists wireroom_cache (
  league        text primary key,
  generated_at  timestamptz not null default now(),
  lead_brief    jsonb not null,
  secondaries   jsonb not null,
  source_count  int not null default 0
);

-- Allow the Edge Function (service role) to read/write freely.
-- The anon key can only read.
alter table wireroom_cache enable row level security;

create policy "anon read" on wireroom_cache
  for select using (true);

create policy "service write" on wireroom_cache
  for all using (auth.role() = 'service_role');
