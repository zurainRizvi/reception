-- Run once if public.rsvps already exists without invite isolation.
-- Existing untagged rows are marked 'complete' so they stay on the full wedding
-- invite admin — they will not appear on the reception (Waleema) admin.

alter table public.rsvps
  add column if not exists invite_key text;

update public.rsvps
set invite_key = 'complete'
where invite_key is null or invite_key = '';

alter table public.rsvps
  alter column invite_key set default 'complete';

alter table public.rsvps
  alter column invite_key set not null;

create index if not exists rsvps_invite_key_submitted_at_idx
  on public.rsvps (invite_key, submitted_at desc);
