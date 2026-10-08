-- Run once in Supabase → SQL Editor

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  response text not null check (response in ('yes', 'no')),
  events text[] not null default '{}',
  guests int not null default 0 check (guests >= 0),
  message text not null default '',
  submitted_at timestamptz not null default now()
);

create index if not exists rsvps_submitted_at_idx on public.rsvps (submitted_at desc);

alter table public.rsvps enable row level security;

-- Frontend-only admin + guest submit use the anon key.
drop policy if exists "Allow anon insert rsvps" on public.rsvps;
create policy "Allow anon insert rsvps"
  on public.rsvps
  for insert
  to anon
  with check (true);

drop policy if exists "Allow anon select rsvps" on public.rsvps;
create policy "Allow anon select rsvps"
  on public.rsvps
  for select
  to anon
  using (true);

-- Needed for the RSVP admin "Reset list" action.
drop policy if exists "Allow anon delete rsvps" on public.rsvps;
create policy "Allow anon delete rsvps"
  on public.rsvps
  for delete
  to anon
  using (true);
