alter table podcast_feeds add column if not exists league text not null default 'epl';

create index podcast_feeds_league on podcast_feeds (league);

-- Tag the four football feeds seeded in 006
update podcast_feeds set league = 'epl' where feed_url like '%acast.com%';
