# LeadReply Engineering Notes

LeadReply is a Next.js App Router product backed by Prisma and PostgreSQL. The code is organized by product area so routes, API handlers, and shared business logic stay easy to find.

## Main Folders

- `src/app`: application routes, pages, route handlers, and feature-specific client components.
- `src/app/api`: server API routes for signup, business settings, CRM actions, providers, webhooks, and admin operations.
- `src/app/components`: shared app-level UI such as navigation.
- `src/auth`: NextAuth configuration.
- `src/lib`: shared domain logic, provider adapters, env validation, security helpers, analytics, readiness scoring, and seed/demo helpers.
- `src/types`: project-level TypeScript declarations.
- `prisma`: Prisma schema and migration history.
- `public`: manifest, icons, robots, sitemap, widget script, and other static files.
- `scripts`: command-line maintenance and smoke-test scripts.
- `docs`: engineering and release documentation.

## Core Product Areas

- Public marketing and auth: `/`, `/signup`, `/login`, `/forgot-password`, `/reset-password`.
- Owner CRM: `/dashboard`, `/snapshot`, `/owner`, `/leads`, `/leads/[id]`, `/missed-calls`, `/analytics`, `/reviews`.
- Setup and launch: `/settings/business`, `/settings/growth`, `/settings/automation`, `/settings/services`, `/settings/calendar`, `/settings/billing`, `/settings/team`, `/settings/import`, `/settings/widget`, `/settings/launch`.
- Admin operations: `/admin/operations`, restricted to users with an admin role.

## Data Model

`Business` is the tenant-like record for an owner account. Most product records belong to a business, including leads, missed calls, follow-up steps, review requests, team notes, services, availability, team members, email logs, and opt-outs.

The Growth plan setup lives on `Business` for now because it is a single-business launch profile:

- SEO: primary services, service areas, keywords, competitors, website page priorities, content ideas, and notes.
- Marketing: channels, audience, goals, offer, content themes, cadence, brand voice, and notes.
- Growth workflow: `GrowthTask` stores owner-facing SEO/marketing work, and `MarketingCalendarItem` stores simple campaign/post planning with draft, approval, scheduled, and posted states.

If LeadReply later supports multi-location businesses or agency-style marketing calendars, these fields can move into dedicated child tables.

## Common Commands

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
npm run lint
npm run test:smoke
npm run build
```

After changing `prisma/schema.prisma`, add a migration, run `npx prisma format`, run `npx prisma validate`, deploy the migration locally, and regenerate the Prisma client.

## Adding A Page

Add a route folder under `src/app`, create `page.tsx`, and add metadata. For authenticated app pages, call `getServerSession(authOptions)` and redirect unauthenticated users to `/login`. Use `AppNav` for owner-facing pages.

## Adding An API Route

Create `route.ts` under `src/app/api`. For authenticated mutations, check the session, validate input with Zod, and call `rejectCrossSiteRequest(req)` before changing data. Keep provider-specific behavior behind helpers in `src/lib` so route handlers stay small.

## Provider Integrations

Provider adapters are designed to fail safely when credentials are missing. Twilio, Stripe, OpenAI, Google, and email delivery should keep useful manual fallbacks so a demo or early client account does not break because a live credential has not been added yet.
