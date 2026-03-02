-- In Supabase Dashboard: SQL Editor → New query → Inhalt einfügen → Run
-- Pillars: ein Eintrag pro Kampagne (Leitbild + Annahmen)
create table if not exists public.pillars (
  id uuid primary key default gen_random_uuid(),
  leitbild text not null default '',
  annahmen text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ideas: Grundideen
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Video ideas: mit optionalem Bezug zu einer Grundidee
create table if not exists public.video_ideas (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete set null,
  title text not null,
  note text,
  status text not null check (status in ('idee', 'skizze', 'produktion', 'fertig')) default 'idee',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: Anon darf alles (für MVP; später einschränken)
alter table public.pillars enable row level security;
alter table public.ideas enable row level security;
alter table public.video_ideas enable row level security;

create policy "Allow all on pillars" on public.pillars for all using (true) with check (true);
create policy "Allow all on ideas" on public.ideas for all using (true) with check (true);
create policy "Allow all on video_ideas" on public.video_ideas for all using (true) with check (true);

-- Optional: updated_at Trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pillars_updated_at before update on public.pillars
  for each row execute function public.set_updated_at();
create trigger ideas_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();
create trigger video_ideas_updated_at before update on public.video_ideas
  for each row execute function public.set_updated_at();

-- Seed: ein Pillar-Eintrag (einmalig im SQL Editor ausführen, wenn gewünscht)
-- insert into public.pillars (leitbild, annahmen)
-- values (
--   'Kurze Formulierung der Kampagnen-Vision und des Ziels …',
--   'Wichtige Prämissen, Zielgruppe, Rahmenbedingungen …'
-- );
