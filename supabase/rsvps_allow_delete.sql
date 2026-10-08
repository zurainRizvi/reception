-- Run once if the rsvps table already exists (adds admin reset support).

drop policy if exists "Allow anon delete rsvps" on public.rsvps;
create policy "Allow anon delete rsvps"
  on public.rsvps
  for delete
  to anon
  using (true);
