# Reception — Waleema Invitation

A Waleema / reception-only invitation for Zurain & Abeeha, based on the Noor-e-Safar design system. Mehndi and Baraat are intentionally omitted so this site can be shared with office friends and wider circle.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For production verification, run `npm run lint`, `npm run typecheck`, and `npm run build`.

## Customize

- `src/config/wedding.ts`: names, wording, Waleema details, countdown target (reception date), RSVP, WhatsApp, music, social preview.
- `src/config/translations.ts`: English and Urdu/RTL labels.
- `src/config/theme.ts`: shared and event palettes, fonts, motion.

## RSVP with Supabase

Guest replies are saved through `RSVPService` in `src/services/rsvp.ts`. With Supabase configured, every Confirm RSVP writes to a shared `rsvps` table (WhatsApp is still optional). Without Supabase, responses stay in the browser’s local storage only.

This reception site always tags rows with `invite_key = reception` (`src/config/invite.ts`). Admin list / reset only touch that key, so Noor-e-Safar complete (or biya) guests never appear here, and reception guests never appear on those other links — even when they share one Supabase project.

### 1. Create the table

In Supabase → SQL Editor, run [`supabase/rsvps.sql`](supabase/rsvps.sql) if the table does not exist yet. If you already created `rsvps` without isolation, run [`supabase/rsvps_invite_key.sql`](supabase/rsvps_invite_key.sql) once instead.

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_RSVP_ADAPTER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_ADMIN_PASSWORD=your_private_password
```

Use only the public anon key in the browser; never expose a service-role key.

### 3. View responses

On the RSVP card, tap the muted **admin** label in the bottom-right corner, enter the admin password, then review attending / declining lists and total guest headcount. **Refresh** reloads from Supabase; **Reset list** clears every saved response (confirm first). If the table already existed before reset support was added, also run [`supabase/rsvps_allow_delete.sql`](supabase/rsvps_allow_delete.sql).

## Vercel deployment

1. Import this repository in Vercel (Next.js preset).
2. Add the Supabase and admin password environment variables for production.
3. Deploy with a new production domain separate from Noor-e-Safar.
4. Optionally set `NEXT_PUBLIC_SITE_URL` to the live reception URL.

Do not put real secrets in client code. The prototype is marked `noindex`.
