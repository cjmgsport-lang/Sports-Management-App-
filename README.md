# Freedom Sports Management

A subscription sports management platform for schools, clubs, universities, franchises, professional teams and federations in South Africa — a single, coherent home for planning, performance, communication and administration, in the spirit of Teamworks / Player 360.

## Modules

- **Editable calendars** — team schedules for training, matches, meetings and travel.
- **Periodised training plans** — seasons broken into macrocycles → mesocycles → weekly microcycles → individual sessions, with a shared drill library.
- **Chat** — per-team channels.
- **Noticeboard** — pinned announcements targeted by audience (coaches / parents / athletes / staff).
- **Fixtures, tournaments & results** — fixture templates, tournaments, fixtures and result capture.
- **GPS / video / session animation / PDF uploads** — files linked to training sessions or fixtures, served through an access-controlled route.
- **Clothing orders** — kit catalogue and per-athlete order lines.
- **Member forms** — member information, medical information (access-restricted) and transport needs.
- **Personal season budgets** — per-athlete budget with line items and paid/unpaid tracking.
- **Individual development plans (IDP)** — goals, strengths, areas for improvement, action plans.
- **Weekly feedback** — coach feedback plus athlete reflection.
- **Trials & selection** — trial events and per-athlete selection decisions.
- **Resource sharing** — booking for fields, balls, cones, poles, mannequins, GPS units and video equipment.
- **Organization settings** — subscription plan, org details, and white-label branding (logo + brand color, applied app-wide).

## Tech stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM — SQLite for zero-config local development
- NextAuth (credentials/JWT) for authentication
- Server actions for all mutations (no separate API layer)

## Getting started

```bash
npm install
cp .env.example .env      # already provided with working local defaults
npm run db:push           # create the local SQLite database
npm run db:seed           # load demo data (org, teams, users, sample records)
npm run dev
```

Open http://localhost:3000 and log in with any of the seeded accounts (password `password123`):

| Email | Role |
| --- | --- |
| owner@freedomsports.co.za | Owner |
| hod@freedomsports.co.za | Head of Department (full permissions) |
| coach@freedomsports.co.za | Coach |
| medical@freedomsports.co.za | Medical staff |
| kabelo@freedomsports.co.za | Athlete |
| emma@freedomsports.co.za | Athlete |
| parent@freedomsports.co.za | Parent |

Or create your own organization from the landing page ("Get started" → sign up).

## Production notes

- **Database**: switch `datasource db { provider = "sqlite" ... }` in `prisma/schema.prisma` to `"postgresql"` and point `DATABASE_URL` at a managed Postgres instance. Role/status/category fields are stored as `String` (validated by zod at the server-action layer) so they work identically on SQLite or Postgres; you can optionally convert them to native Prisma `enum` types once on Postgres.
- **File storage**: uploads are written to `UPLOADS_DIR` on local disk and served through `/api/files/[assetId]`, which checks organization membership before streaming. For production, swap `src/lib/storage.ts` for an S3-compatible object store.
- **Secrets**: set a strong `NEXTAUTH_SECRET` and correct `NEXTAUTH_URL` in production.
- **Billing**: the `Subscription` model and settings page are billing-ready placeholders — wire up a payment provider (e.g. Paystack, Stripe) to move orgs between plans automatically.
