# Freedom Sports Management

A subscription sports management platform for schools, clubs, universities, franchises, professional teams and federations in South Africa — a single, coherent home for planning, performance, communication and administration, in the spirit of Teamworks / Player 360.

## Modules

- **Editable calendars** — team schedules for training, matches, meetings and travel.
- **Training plans, built on tactical periodisation** — a per-team **Game Model** (principles of play under the four moments: offensive organization, defensive organization, attacking transition, defensive transition, plus set pieces) that every drill is tagged against; seasons run macrocycles → mesocycles → weekly **morphocycles** (microcycles built backward from the next match with MD-4…MD-1 match-day codes, a dominant moment and sub-dynamic per day — duration → speed-endurance → speed → activation) → individual sessions.
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
- Prisma ORM + Postgres
- NextAuth (credentials/JWT) for authentication
- Server actions for all mutations (no separate API layer)
- File uploads: local disk in dev, [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) in production (auto-detected)

## Getting started

You need a Postgres database. The fastest way to get one locally:

```bash
docker run -d --name freedom-sports-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

(Or use a free hosted instance — [Neon](https://neon.tech) or [Supabase](https://supabase.com) both work and are handy if you'd rather skip Docker, since you'll want one for deployment anyway.)

```bash
npm install
cp .env.example .env      # edit DATABASE_URL / DIRECT_URL if not using the docker command above
npm run db:migrate        # apply the committed migrations to create the schema
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

## Deploying to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcjmgsport-lang%2FSports-Management-App-%2Ftree%2Fclaude%2Ffreedom-sports-management-fj048x&env=DATABASE_URL,DIRECT_URL,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Postgres%20connection%20strings%20and%20auth%20config%20%E2%80%94%20see%20the%20README%20for%20details&envLink=https%3A%2F%2Fgithub.com%2Fcjmgsport-lang%2FSports-Management-App-%2Fblob%2Fclaude%2Ffreedom-sports-management-fj048x%2FREADME.md%23deploying-to-vercel&project-name=freedom-sports-management&repository-name=freedom-sports-management)

*(Once this branch is merged to your default branch, drop the `/tree/claude/freedom-sports-management-fj048x` from the button's `repository-url` so it deploys from `main` instead.)*

Steps:

1. **Click the button above.** Vercel will ask you to import/fork the repo into your own GitHub account, then prompts for the environment variables below.
2. **Get a Postgres database.** [Neon](https://neon.tech) has a generous free tier and, like Vercel Postgres, gives you two connection strings out of the box:
   - `DATABASE_URL` — the **pooled** connection string (what the app uses at runtime, across many serverless function instances).
   - `DIRECT_URL` — the **direct/unpooled** connection string (used only when Vercel runs `prisma migrate deploy` during the build). If your provider only gives you one connection string, set both variables to the same value.
3. **Set `NEXTAUTH_SECRET`** — generate one with `openssl rand -base64 32`.
4. **Set `NEXTAUTH_URL`** to `https://<the-project-name-you-pick>.vercel.app` (Vercel shows/lets you edit the project name during import, and the URL follows it directly). If the deployed URL ends up different, update this in **Project Settings → Environment Variables** and redeploy.
5. **Deploy.** The build runs `prisma generate && prisma migrate deploy && next build`, so the schema is created automatically on first deploy — no manual migration step needed.
6. **(Recommended) Add a Blob store** so file uploads (GPS/video/session animation/PDF, logos) persist: in the Vercel project, go to **Storage → Create Database → Blob**, and connect it to the project. Vercel sets `BLOB_READ_WRITE_TOKEN` automatically, and the app picks it up with no code changes — see "File storage" below. Without it, uploads fall back to local disk, which does **not** persist between requests on Vercel.

## Production notes

- **Database**: Postgres is required (SQLite doesn't work on serverless hosts with an ephemeral filesystem). `prisma/migrations/` is committed to the repo; run `npm run db:migrate` (`prisma migrate dev`) locally after changing `schema.prisma` to generate a new migration, and commit the result — `prisma migrate deploy` (run automatically by `npm run build`) only *applies* committed migrations, it never generates them.
- **File storage**: `src/lib/storage.ts` writes to local disk by default (fine for local dev). When `BLOB_READ_WRITE_TOKEN` is set (Vercel sets this automatically once you attach a Blob store — see above), it uploads to Vercel Blob instead. Either way, files are only ever served through the access-controlled routes (`/api/files/[assetId]`, `/api/org-logo/[orgId]`), which check organization membership server-side before streaming — the Blob URL itself is never exposed to the client.
- **Secrets**: set a strong `NEXTAUTH_SECRET` and correct `NEXTAUTH_URL` in production.
- **Billing**: the `Subscription` model and settings page are billing-ready placeholders — wire up a payment provider (e.g. Paystack, Stripe) to move orgs between plans automatically.
