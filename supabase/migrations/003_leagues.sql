create table if not exists leagues (
  slug         text primary key,          -- 'epl', 'laliga', etc.
  api_id       text not null,             -- ESPN league id
  name         text not null,
  logo_url     text,
  dark_logo_url text,
  updated_at   timestamptz default now()
);
