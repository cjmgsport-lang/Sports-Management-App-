# Freedom Sports Management

A subscription sports management platform for schools, clubs, universities, franchises, professional teams and federations in South Africa — a single, coherent home for planning, performance, communication and administration, in the spirit of Teamworks / Player 360.

## Two areas: Administration and Sport

The whole app is split into two switchable areas (a toggle at the top of the sidebar, remembered per browser) — the same underlying data, organized around who's using it day to day.

**Administration**

- **People** — a staff directory (Manager, Administrative Assistant, Coach, Assistant Coach, Logistics Manager, Performance Psychologist, Physiotherapist, Strength & Conditioning Coach, Performance Analyst), plus Teams & Members and Member Forms.
- **Planning** — a seeded 2026–2031 calendar of South African public holidays and approximate school/university terms; the team's Game Model as the tactical periodisation template; a generator that builds a full microcycle (morphocycle) from one of four named fixture patterns — single match on a Saturday, single match on a Sunday, a Saturday/Sunday double header, or a Thursday/Sunday double header — anchored to the match date(s).
- **Data** — match reports (goals, goalscorers, cards) on each fixture; GPS/video/PDF uploads; personal & medical member info; strength & conditioning entries (bench/squat, sprint times, vertical jump); the injury process (player, date injured, report, treatment, healing, rehabilitation, return-to-train/return-to-play dates); and training folders for arbitrary session files.
- **Trials & selection** — trial events, per-athlete selection decisions, and the nine whole-athlete selection domains (biological, conditioning, coordination, cognitive, socio-affective, creative, emotional skill, mental, leadership & character), scored 1–5.
- **Fixture list & tournaments**, **Resources & booking** (fields, balls, bibs, cones, flat markers, poles, mannequins, mini-goals, GPS units, video equipment, video analysis).

**Sport**

- **Tactical periodisation** — the same Game Model, Training Plans/morphocycles and a new **Game Continuum**: the six moments of the game (possession, counter attack, ball recovery & counter defence, set piece, attacking scoring behaviour, defensive goal area behaviour), each with an uploaded field-space image and description, per team.
- **Squad** — a People & Team roster (name/surname/position), a Recruitment & Retention register (name, surname, DOB, start/end year, position/role, bursary/cost, dual career), and Individual Development Plans that show the athlete's trial selection-criteria scores for reference.
- **Training** — image, PDF, animation and video uploads organized into four fixed folders: Foundations, Positional/Relational Games, Specific Scenario Simulations, Tactical Games.
- **Communicate** — Team Chat (live team channels, 1:1 direct messages, coach-curated "unit" chats) plus a separate **Leadership Chat** for captains/senior players and coaching staff.
- **Feedback** — weekly coach feedback and athlete reflection, with video/presentation attachments.
- **Compete** — Fixtures & Results, Tournaments.

Every spreadsheet-style table (staff, trials criteria, injuries, recruitment, rosters) has an **Export CSV** link.

## Modules

- **Editable calendars** — team schedules for training, matches, meetings and travel, plus the org-wide 5-year planning calendar above.
- **Training plans, built on tactical periodisation** — a per-team **Game Model** (principles of play under the four moments: offensive organization, defensive organization, attacking transition, defensive transition, plus set pieces) that every drill is tagged against; seasons run macrocycles → mesocycles → weekly **morphocycles** (microcycles built backward from the next match with MD-4…MD-1 match-day codes — plus MD-2/MD-1/MD "second match" codes for double-header weeks — a dominant moment and sub-dynamic per day) → individual sessions.
- **Chat** — live (polling-based, no refresh needed) team channels, 1:1 direct messages between any two members, coach-curated small "unit" group chats from a team's roster, a separate leadership chat, and an admin-to-parents broadcast channel (org-wide, read-only for parents).
- **Noticeboard** — pinned announcements targeted by audience (coaches / parents / athletes / staff).
- **Fixtures, tournaments & results** — fixture templates, tournaments, fixtures, result capture, and structured goals/goalscorers/cards per match.
- **GPS / video / session animation / PDF uploads** — files linked to training sessions or fixtures, served through an access-controlled route; admins can also organize uploads into named folders.
- **Clothing orders** — kit catalogue and per-athlete order lines.
- **Member forms** — member information, medical information (access-restricted) and transport needs.
- **Personal season budgets** — per-athlete budget with line items and paid/unpaid tracking.
- **Individual development plans (IDP)** — goals, strengths, areas for improvement, action plans, with trial-criteria scores pulled through for reference.
- **Weekly feedback** — coach feedback plus athlete reflection, with video/presentation uploads.
- **Trials & selection** — trial events, per-athlete selection decisions and the nine selection-criteria scores.
- **Resource sharing** — booking for fields, balls, bibs, cones, flat markers, poles, mannequins, mini-goals, GPS units, video equipment and video analysis.
- **Organization settings** — org details, white-label branding (logo + brand color, applied app-wide and on a public page — see below), and real subscription billing via Paystack (Growth/Pro checkout with a monthly or annual price, cancellation, webhook-driven renewals, enforced seat limits per plan).
- **Public org page** (`/o/[slug]`, no login required) — a shareable page for each client's own community, using their logo and brand color automatically; the description is editable from Settings.

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
| manager@freedomsports.co.za | Manager |
| admin.assistant@freedomsports.co.za | Administrative Assistant |
| logistics@freedomsports.co.za | Logistics Manager |
| psych@freedomsports.co.za | Performance Psychologist |
| physio@freedomsports.co.za | Physiotherapist |
| strength@freedomsports.co.za | Strength & Conditioning Coach |
| analyst@freedomsports.co.za | Performance Analyst |

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
7. **(Optional) Add Paystack env vars** once you want the Growth/Pro upgrade buttons to work for real — see "Billing (Paystack)" below. The app runs fine without them; only those two buttons need the keys.

## Production notes

- **Database**: Postgres is required (SQLite doesn't work on serverless hosts with an ephemeral filesystem). `prisma/migrations/` is committed to the repo; run `npm run db:migrate` (`prisma migrate dev`) locally after changing `schema.prisma` to generate a new migration, and commit the result — `prisma migrate deploy` (run automatically by `npm run build`) only *applies* committed migrations, it never generates them.
- **File storage**: `src/lib/storage.ts` writes to local disk by default (fine for local dev). When `BLOB_READ_WRITE_TOKEN` is set (Vercel sets this automatically once you attach a Blob store — see above), it uploads to Vercel Blob instead. Either way, files are only ever served through the access-controlled routes (`/api/files/[assetId]`, `/api/org-logo/[orgId]`), which check organization membership server-side before streaming — the Blob URL itself is never exposed to the client.
- **Secrets**: set a strong `NEXTAUTH_SECRET` and correct `NEXTAUTH_URL` in production.

## Billing (Paystack)

Growth and Pro are real, paid subscriptions via [Paystack](https://paystack.com) Standard Checkout + Subscriptions, each billable monthly or annually. Starter is free (no checkout) and Enterprise is "contact sales" (no self-serve checkout — it's custom-priced).

| Plan | Monthly | Annual |
| --- | --- | --- |
| Growth | R899 / month | R8,999 / year |
| Pro | R1,100 / month | R11,999 / year |

**Setup:**

1. In your Paystack dashboard, go to **Payments → Plans** and create **four** plans in ZAR — since a Paystack plan is fixed to one billing interval, Growth and Pro each need a monthly plan and an annual plan: Growth Monthly (R899), Growth Annual (R8,999), Pro Monthly (R1,100), Pro Annual (R11,999). The amounts must match `PLAN_PRICING` in `src/lib/paystack.ts`, so update one side if you change pricing. Copy each plan's code.
2. Set env vars: `PAYSTACK_SECRET_KEY` (Settings → API Keys & Webhooks — use the **test** secret key until you're ready to go live), `PAYSTACK_PLAN_CODE_GROWTH_MONTHLY`, `PAYSTACK_PLAN_CODE_GROWTH_ANNUAL`, `PAYSTACK_PLAN_CODE_PRO_MONTHLY`, `PAYSTACK_PLAN_CODE_PRO_ANNUAL`.
3. In the same dashboard page, set the **Webhook URL** to `https://<your-domain>/api/webhooks/paystack`. This is the durable, authoritative path that keeps subscriptions in sync (renewals, failed payments, cancellations) — the settings page also verifies-and-applies immediately when Paystack redirects a customer back after checkout, purely for instant UI feedback, but the webhook is what you can rely on if a customer closes their browser mid-payment.
4. Test with a [Paystack test card](https://paystack.com/docs/payments/test-payments/) before switching to live keys.

**How it works**, if you're changing anything: `src/lib/paystack.ts` is the API client (checkout init, transaction verify, subscription fetch/disable, webhook signature check); `src/lib/billing-events.ts` applies an event to our `Subscription` row and is called from both the webhook route and the settings page's verify-on-return, so either path landing first is enough and neither can double-apply anything. `src/lib/actions/billing.ts` has the checkout-start and cancel actions; `switchToFreeAction` in `src/lib/actions/settings.ts` handles the free downgrade (which also cancels any live Paystack subscription).

**What's verified vs. not**: this was built and tested in a sandboxed environment with no Paystack account access. The webhook handler itself — signature verification, event parsing, and every database update it makes — was verified end-to-end against a real Postgres database using hand-crafted, correctly-signed synthetic webhook payloads for every event type (`charge.success`, `subscription.create`, `subscription.disable`/`not_renew`, `invoice.payment_failed`), including confirming an incorrectly-signed request is rejected. What was **not** tested is an actual live round trip against Paystack's servers (starting checkout, paying with a test card, receiving Paystack's real webhook). Do that once with test keys before accepting real payments — if Paystack's actual payload field names differ from what `src/lib/billing-events.ts` expects in `findSubscriptionForEvent`/the individual `apply*` functions (documented there), that's the first place to check.
