# LeadReply Engineering Notes

LeadReply is a Next.js App Router product backed by Prisma and PostgreSQL. The code is organized by product area so routes, API handlers, and shared business logic stay easy to find.

## Main Folders

- `src/app`: application routes, pages, route handlers, and feature-specific client components.
- `src/app/api`: server API routes for signup, business settings, CRM actions, providers, webhooks, and admin operations.
- `src/components`: shared app-level UI such as navigation and reusable status buttons.
- `src/features`: module-specific UI components and feature documentation.
- `src/services`: business logic grouped by product module, plus AI, security, and observability services.
- `src/services/queue`: BullMQ queue setup, enqueue helpers, retry, and cancellation.
- `src/services/jobs`: worker-safe automation job handlers.
- `src/workers`: separate worker entrypoints. Run with `npm run worker`.
- `src/auth`: NextAuth configuration.
- `src/lib`: shared helpers grouped into analytics, config, data, domain, growth, integrations, and security.
- `src/lib/domain/status.ts`: shared persisted status constants for leads, missed calls, missed-call assistant intakes, communications, jobs, billing, and appointments.
- `src/proxy.ts`: Next.js request proxy for API rate limiting and request IDs; keep at `src` root.
- `src/instrumentation.ts`: Next.js request-error instrumentation; keep at `src` root.
- `src/types`: project-level TypeScript declarations.
- `prisma`: Prisma schema and migration history.
- `public`: manifest, icons, robots, sitemap, widget script, and other static files.
- `scripts`: command-line maintenance and smoke-test scripts.
- `docs`: engineering and release documentation.

## Core Product Areas

- Public marketing and auth: `/`, `/signup`, `/login`, `/forgot-password`, `/reset-password`.
- Owner modules: Customers/Jobs and Inbox (`/leads`, `/missed-calls`), Reviews (`/reviews`), Growth (`/growth`).
- Owner utility routes: `/dashboard`, `/snapshot`, `/owner`, `/notifications`. Snapshot includes reporting for money made, lead sources, response speed, reviews, and ROI.
- Setup and launch: `/settings/business`, `/settings/security`, `/settings/appearance`, `/settings/billing`, `/settings/automation`, `/settings/phone-lines`, `/settings/services`, `/settings/calendar`, `/settings/team`, `/settings/widget`, `/settings/launch`.
- Admin operations: `/admin`, restricted to users whose email is listed in `ADMIN_EMAILS`.

## Deeper References

- Architecture decisions: `docs/ARCHITECTURE.md`
- Database notes: `docs/DATABASE.md`
- API route notes: `docs/API.md`
- Compliance and business memory: `docs/COMPLIANCE_AND_BUSINESS_MEMORY.md`
- Security and data practices: `docs/SECURITY_AND_DATA_PRACTICES.md`
- Business/user permissions: `docs/PERMISSIONS.md`
- Theme and UI style rules: `docs/STYLE_GUIDE.md`
- Competitor and positioning research: `docs/COMPETITOR_RESEARCH.md`

## Data Model

`Business` is the tenant-like record for an owner account. Most product records belong to a business, including leads, missed calls, follow-up steps, review requests, team notes, services, availability, team members, email logs, opt-outs, service opportunities, website audits, growth plans, AI usage logs, and internal operations records.

The SEO and Marketing module setup lives on `Business` for now because it is a single-business launch profile:

- SEO: primary services, service areas, keywords, competitors, website page priorities, content ideas, and notes.
- Marketing: channels, audience, goals, offer, content themes, cadence, brand voice, and notes.
- Digital presence: website, Google profile, Facebook, Instagram, booking path, review destination, logo/brand assets, and setup-help preference.
- Growth workflow: `GrowthTask` stores owner-facing presence/SEO/marketing work, and `MarketingCalendarItem` stores simple campaign/post planning with draft, approval, scheduled, and posted states.
- Future service pipeline: `ServiceOpportunity` records missing pieces that can become paid setup or management work later.
- Website audit V1: `WebsiteAuditRun` and `WebsiteAuditFinding` store permission-based client-site audit results and create growth tasks from high/medium findings.
- Growth plan foundation: `GrowthPlan` stores rules-first or OpenAI-generated recommendations. `AiUsageLog` records growth-plan and future AI feature usage.
- Business memory: `BusinessMemorySource` stores the imported website/file/API/profile source, and `BusinessMemoryItem` stores extracted facts that must be approved before AI treats them as trusted context.
- Admin operations: `InternalWorker`, `InternalTaskAssignment`, `InternalClientNote`, and `OpsJobRun` power the `/admin` portal for worker assignments, client notes, content approvals, integration visibility, AI usage, and future background-job tracking.
- Background automation: `OpsJobRun` records BullMQ job IDs, idempotency keys, status, attempts, queue/start/finish timestamps, errors, payload metadata, and result data.

If LeadReply later supports multi-location businesses or agency-style marketing calendars, these fields can move into dedicated child tables.

## Common Commands

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
npm run worker
npm run worker:dev
npm run lint
npm run test:smoke
npm run test:service
npm run build
```

After changing `prisma/schema.prisma`, add a migration, run `npx prisma format`, run `npx prisma validate`, deploy the migration locally, and regenerate the Prisma client.

## Adding A Page

Add a route folder under `src/app`, create `page.tsx`, and add metadata. For authenticated app pages, call `getServerSession(authOptions)` and redirect unauthenticated users to `/login`. Use `AppNav` for owner-facing pages.

## Adding An API Route

Create `route.ts` under `src/app/api`. For authenticated mutations, check the session, validate input with Zod, and call `rejectCrossSiteRequest(req)` before changing data. Global API rate limits run through `src/proxy.ts`; use stricter route-level limits for public forms, auth-sensitive work, AI-heavy jobs, and provider callbacks. Use `captureException` for caught errors that would otherwise be swallowed by a friendly API response.

## Provider Integrations

Provider adapters are designed to fail safely when credentials are missing. Twilio, Stripe, OpenAI, Google, and email delivery should keep useful manual fallbacks so a demo or early client account does not break because a live credential has not been added yet.

## Observability

- `src/proxy.ts` assigns request IDs, applies API route rate limits, and writes structured request/rate-limit logs.
- `src/instrumentation.ts` captures unhandled Next.js request errors.
- `src/services/observability/logger.ts` writes JSON logs with basic secret redaction.
- `src/services/observability/ai-usage.ts` records AI usage to `AiUsageLog` without blocking the user if logging itself fails.
- `src/services/security/security-events.ts` records best-effort audit events for account, billing, and admin-sensitive actions without storing secrets.
- Set `LOG_LEVEL=info` in production and `LOG_LEVEL=debug` only when troubleshooting.

## Security Event Rules

- Log signup completion, password reset requests/completions, password changes, billing plan/checkout/portal actions, and admin client-account edits.
- Keep audit metadata small and safe. Field names, previous/current plan values, and non-secret provider status reasons are okay. Passwords, reset tokens, card data, webhook signatures, cookies, and raw provider payloads are not okay.
- Security-event logging should not block the user action if the audit write fails; use structured logs to surface that failure.

## Growth Automation Flow

1. Onboarding, `/settings/memory`, `/growth`, and `/growth` collect business memory.
2. `/api/business/digital-presence` saves presence fields and upserts future service opportunities.
3. `/api/website-audits/run` queues a website audit. The worker audits only the saved public website, rejects local/private network targets, stores findings, and creates growth tasks.
4. `/api/growth-plan/generate` queues a growth-plan job. The worker builds a rules-first plan, optionally asks OpenAI for a refined plan, stores recommendations, logs usage, creates growth tasks, and adds approval-ready marketing calendar ideas.
5. Dashboard and launch readiness use the same readiness helpers so owners see the next best action instead of raw setup complexity.

## Background Worker Flow

1. The web app validates the request and creates an `OpsJobRun`.
2. `src/services/queue/jobs.ts` adds a BullMQ job to Redis.
3. `npm run worker` starts `src/workers/index.ts` as a separate process.
4. The worker marks the job running, calls the correct `src/services/jobs` handler, then marks it succeeded, failed, retrying, or cancelled.
5. `/admin` reads `OpsJobRun` so LeadReply operators can see queued, running, failed, and completed automation.
