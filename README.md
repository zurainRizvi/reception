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

## Vercel deployment

1. Import this repository in Vercel (Next.js preset).
2. Deploy with a new production domain separate from Noor-e-Safar.
3. Optionally set `NEXT_PUBLIC_SITE_URL` to the live reception URL.

Do not put real secrets in client code. The prototype is marked `noindex`.
