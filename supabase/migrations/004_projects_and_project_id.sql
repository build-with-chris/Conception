-- Multi-Projekt: Tabelle projects + project_id in allen Tabellen
-- Bestehende Daten gehen nicht verloren: Default-Projekt anlegen, alle Zeilen zuordnen

-- 1. Tabelle projects (lesbare URLs über slug; "title" statt "name" wegen PostgreSQL-Typ name)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_unique unique (slug)
);

-- Trigger für updated_at
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- RLS
alter table public.projects enable row level security;
create policy "Allow all on projects" on public.projects for all using (true) with check (true);

-- 1b. Falls Tabelle projects schon existiert mit anderer Struktur: fehlende Spalten ergänzen
alter table public.projects add column if not exists title text;
alter table public.projects add column if not exists slug text;
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();
update public.projects set title = 'Erstes Projekt' where title is null;
update public.projects set slug = 'erstes-projekt' where slug is null;
-- Duplikate beim Slug entfernen (nur eine Zeile behält 'erstes-projekt', Rest bekommt eindeutigen Slug)
with dups as (
  select id, slug, row_number() over (partition by slug order by created_at nulls last) as rn
  from public.projects
)
update public.projects p
set slug = p.slug || '-' || substr(p.id::text, 1, 8)
from dups d
where p.id = d.id and d.rn > 1;
alter table public.projects alter column title set not null;
alter table public.projects alter column slug set not null;
create unique index if not exists projects_slug_unique on public.projects(slug);

-- 2. Default-Projekt für alle bestehenden Daten (einmalig)
insert into public.projects (title, slug)
values ('Erstes Projekt', 'erstes-projekt')
on conflict (slug) do nothing;

-- 3. Spalte project_id hinzufügen (zunächst nullable)
alter table public.pillars
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

alter table public.ideas
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

alter table public.video_ideas
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- 4. Alle bestehenden Zeilen dem Default-Projekt zuweisen (kein Datenverlust)
update public.pillars
set project_id = (select id from public.projects where slug = 'erstes-projekt' limit 1)
where project_id is null;

update public.ideas
set project_id = (select id from public.projects where slug = 'erstes-projekt' limit 1)
where project_id is null;

update public.video_ideas
set project_id = (select id from public.projects where slug = 'erstes-projekt' limit 1)
where project_id is null;

-- 5. project_id auf NOT NULL setzen (nur wenn alle Zeilen gesetzt sind)
alter table public.pillars
  alter column project_id set not null;

alter table public.ideas
  alter column project_id set not null;

alter table public.video_ideas
  alter column project_id set not null;

-- 6. Index für schnelle Filterung nach Projekt
create index if not exists idx_pillars_project_id on public.pillars(project_id);
create index if not exists idx_ideas_project_id on public.ideas(project_id);
create index if not exists idx_video_ideas_project_id on public.video_ideas(project_id);
