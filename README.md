# LeadReply

LeadReply is a Next.js SaaS CRM for missed-call follow-up, lead capture, reviews, analytics, and business optimization. It has account signup, guided onboarding, a tailored dashboard, a Lead Center, missed-call concierge intake, service setup, review workflow, billing setup, and launch-readiness checks.

## Run locally

Run commands from the project folder:

```bash
cd /mnt/c/Users/zoene/saas/Leadreply
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open:

```text
http://localhost:3000
```

If the dev server gets stale after adding routes, schema changes, or migrations, stop it with `Ctrl + C` and start it again.

## Useful pages

```text
/signup
/login
/dashboard
/snapshot
/leads
/missed-calls
/analytics
/reviews
/settings/business
/settings/growth
/settings/automation
/settings/services
/settings/billing
/settings/launch
```

## Local database

This project uses PostgreSQL through Prisma. Set `DATABASE_URL` in `.env` before running migrations.

Example local connection string:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/leadreply?schema=public"
```

Create the `leadreply` database in your local Postgres server first, then run:

```bash
createdb leadreply
```

After schema changes, run migrations and regenerate Prisma Client:

```bash
npx prisma generate
npx prisma migrate deploy
```

## Current product flow

- A user signs up, selects a business category and plan, and gets starter services and availability.
- The dashboard adapts setup prompts, analytics, and next actions by category and plan.
- The CRM tracks leads, missed calls, follow-ups, appointment outcomes, captured revenue, reviews, team notes, and lead quality.
- The missed-call concierge asks industry-specific questions, applies scheduling and quote guard rails, and can use OpenAI when configured.
- Growth setup collects SEO services, service areas, target keywords, website priorities, marketing channels, campaign goals, offers, content themes, and brand voice.
- Twilio and Stripe provider paths are wired with safe fallbacks until production credentials are added.

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
```

Stripe webhooks should point to:

```text
/api/webhooks/stripe
```

Use `/settings/growth` to prepare SEO and marketing details, then use `/settings/launch` to see missing provider keys, business setup gaps, CRM activity counts, and launch cleanup controls.

## Before production

- Point `DATABASE_URL` at a hosted Postgres database.
- Use strong production values for `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `APP_BASE_URL`.
- Add Twilio, OpenAI, Stripe, and Google env values in the deployment host.
- Run `npx prisma migrate deploy` against production before sending traffic.
- Use `/settings/launch` to clear CRM activity before onboarding a real client.
- Run `npm run build` in the same environment where dependencies were installed.
