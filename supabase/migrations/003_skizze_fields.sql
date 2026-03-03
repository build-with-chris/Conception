-- Skizze-Details für Videoideen (Notizen, To-dos, Kommentar)
alter table public.video_ideas
  add column if not exists skizze_notes text,
  add column if not exists skizze_todos jsonb not null default '[]',
  add column if not exists skizze_comment text;
