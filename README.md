# LeadReply

LeadReply is a small Next.js SaaS prototype for missed-call follow-up. It has account signup, business onboarding, a tailored dashboard, editable business settings, saved reply templates, and a missed-call inbox.

## Run locally

Run commands from the project folder:

```bash
cd /mnt/c/Users/zoene/saas/leadreply
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
/missed-calls
/settings/business
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

- A user signs up with business name, phone, and category.
- The dashboard adapts copy for home services, beauty services, or food/restaurants.
- Business settings let the user update business details and save a missed-call reply template.
- The missed-call inbox stores call records in the database and lets the user copy a reply or mark a call as replied.

## Before production

- Point `DATABASE_URL` at a hosted Postgres database.
- Use a strong production `NEXTAUTH_SECRET`.
- Keep Twilio credentials in environment variables only.
- Add a preview step before sending real SMS messages.
- Run `npm run build` in the same environment where dependencies were installed.
