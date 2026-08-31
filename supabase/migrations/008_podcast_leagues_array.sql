-- Replace single league with a multi-value array
alter table podcast_feeds
  add column if not exists leagues text[] not null default '{}';

-- Migrate existing single-league rows
update podcast_feeds set leagues = array[league] where league is not null and league <> '';

-- Drop the old scalar column and its index
drop index if exists podcast_feeds_league;
alter table podcast_feeds drop column if exists league;

create index podcast_feeds_leagues on podcast_feeds using gin (leagues);
