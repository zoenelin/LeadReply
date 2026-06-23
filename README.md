# LeadReply

LeadReply is a Next.js SaaS CRM and local-business growth system focused first on home-services companies. It combines missed-call text-back, LeadReply missed-call assistant intake, a simple Customers/Jobs workspace, reviews, analytics, digital presence, SEO, marketing planning, and business optimization. The product direction is a sharp, minimal CRM that captures more leads while LeadReply handles as much setup, follow-up, SEO, and marketing work as possible for the business owner.

## Run locally

Run commands from the project folder:

```bash
cd /mnt/c/Users/zoene/saas/Leadreply
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed:dev
npm run dev
```

Open:

```text
http://localhost:3000
```

If the dev server gets stale after adding routes, schema changes, or migrations, stop it with `Ctrl + C` and start it again.

Run the automation worker in a separate terminal when testing queued jobs:

```bash
npm run worker
```

Queued jobs require Redis. For local development use:

```text
REDIS_URL="redis://localhost:6379"
```

## Useful pages

```text
/signup
/login
/dashboard
/snapshot
/leads
/missed-calls
/reviews
/marketing
/seo
/settings/business
/settings/automation
/settings/services
/settings/billing
/settings/launch
```

`/analytics` is kept as a legacy redirect to `/dashboard#money-made`; reporting now lives inside Snapshot.

## Documentation

- `docs/ENGINEERING.md`: engineering guide and common workflows.
- `docs/ARCHITECTURE.md`: module architecture, folder boundaries, and integration direction.
- `docs/DATABASE.md`: Prisma/PostgreSQL model notes.
- `docs/API.md`: API route map and handler rules.
- `docs/MISSED_CALL_ASSISTANT.md`: missed-call assistant prompt builder and scaling design.
- `docs/COMPETITOR_RESEARCH.md`: competitor positioning research and product lessons.
- `docs/GROWTH_AUTOMATION.md`: growth automation, audit, and AI plan notes.
- `docs/COMPLIANCE_AND_BUSINESS_MEMORY.md`: approved business memory and compliance guardrail notes.
- `docs/PRICING_AND_SERVICES_PLAN.md`: service cost and pricing assumptions.
- `docs/RELEASE_CHECKLIST.md`: before-launch checklist.

## Local Database

This project uses PostgreSQL through Prisma. Set `DATABASE_URL` in `.env` before running migrations.

Example local connection string:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/leadreply?schema=public"
```

If you do not have a local Postgres service installed, Docker is the easiest local option:

```bash
docker run --name leadreply-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=leadreply \
  -p 5432:5432 \
  -d postgres:16-alpine
```

After schema changes, run migrations, regenerate Prisma Client, and reseed the local demo account:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed:dev
```

`npm run seed:dev` creates or refreshes a local admin owner, a home-services demo business, Customers/Jobs rows, missed calls, review requests, SEO/marketing tasks, and admin operations data. It refuses to run against non-local database URLs unless `ALLOW_NONLOCAL_SEED=true` is set.

Optional seed overrides:

```bash
SEED_ADMIN_EMAIL="owner@example.com" SEED_ADMIN_PASSWORD="Use-a-local-password" npm run seed:dev
```

## Current product flow

- A user signs up, selects a business category and plan, and gets starter services and availability.
- The dashboard adapts setup prompts, analytics, and next actions by category and plan.
- The Customers/Jobs workspace tracks customers, jobs, source details, campaign links, missed calls, follow-ups, appointment outcomes, money made, review requests, and team notes.
- The missed-call assistant asks industry-specific questions, applies scheduling and quote guard rails, and can use OpenAI when configured.
- SEO and Marketing modules collect digital presence, website, Google profile, Facebook, Instagram, booking, reviews, brand assets, SEO services, service areas, target keywords, website priorities, marketing channels, campaign goals, offers, content themes, and brand voice.
- The SEO and Marketing workbench turns presence, search, campaign, website audit, and growth-plan gaps into saved tasks, owner next-best actions, future service opportunities, and a simple marketing calendar.
- Deep website audit V1 scans the business website with permission, scores SEO/conversion basics, and creates growth tasks from high-priority findings.
- Business memory lets owners import existing website, file, API, or profile text and approve facts before AI uses them.
- Compliance guardrails apply source-cited industry/state rules to AI replies, SEO, marketing, reviews, SMS, booking, and quote workflows.
- Growth plan generation works with deterministic rules first and can use OpenAI when configured, while logging AI usage for admin visibility.
- Redis/BullMQ background workers handle slow jobs such as missed-call text-back, missed-call assistant AI refinement, website audits, growth plans, lead imports, and owner email summaries.
- API routes have a global rate-limit layer, request IDs, structured logs, and basic request error capture.
- Twilio and Stripe provider paths are wired with safe fallbacks and verified webhook signatures until production credentials are added.

## Launch integrations

Add these values in production env settings:

```text
APP_BASE_URL
NEXTAUTH_URL
OPENAI_API_KEY
OPENAI_MODEL
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID
STRIPE_SECRET_KEY
STRIPE_PRICE_BASIC
STRIPE_PRICE_GROWTH
STRIPE_PRICE_COMPLETE
STRIPE_WEBHOOK_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
REDIS_URL
WORKER_CONCURRENCY
```

Stripe webhooks should point to:

```text
/api/webhooks/stripe
```

Use `/growth` and `/growth` to prepare search and campaign details, then use `/settings/launch` to see missing provider keys, business setup gaps, CRM activity counts, and launch cleanup controls.

## Before production

- Point `DATABASE_URL` at a hosted Postgres database.
- Use strong production values for `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `APP_BASE_URL`.
- Add Twilio, OpenAI, Stripe, and Google env values in the deployment host.
- Add hosted Redis and run `npm run worker` as a separate production worker service.
- Run `npx prisma migrate deploy` against production before sending traffic.
- Use `/settings/launch` to clear CRM activity before onboarding a real client.
- Run `npm run build` in the same environment where dependencies were installed.
