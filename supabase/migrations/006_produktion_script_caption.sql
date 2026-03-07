-- Skript und Caption für Videoideen „In Produktion“
alter table public.video_ideas
  add column if not exists script text,
  add column if not exists caption text;
