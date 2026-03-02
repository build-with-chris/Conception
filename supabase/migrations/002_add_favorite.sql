-- Favoriten für Ideas und Video-Ideas
alter table public.ideas add column if not exists favorite boolean not null default false;
alter table public.video_ideas add column if not exists favorite boolean not null default false;
