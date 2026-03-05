-- Passwortschutz für Kunden-Projekte: optionales Passwort pro Projekt

alter table public.projects
  add column if not exists password_protected boolean not null default false,
  add column if not exists password_hash text;

comment on column public.projects.password_protected is 'Wenn true, muss beim Aufruf des Projekts ein Passwort eingegeben werden.';
comment on column public.projects.password_hash is 'bcrypt-Hash des Projektpassworts; nur gesetzt wenn password_protected = true.';
