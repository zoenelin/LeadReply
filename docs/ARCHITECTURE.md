# LeadReply Architecture

Last updated: June 15, 2026

## Product Focus

LeadReply is home-services-first for launch. See `docs/HOME_SERVICES_FOCUS.md`.

The core product is a simple CRM with AI lead capture for home-service companies. SEO and marketing are paid growth requests that LeadReply can fulfill manually, automate, or both.

## Product Modules

LeadReply is organized around the Snapshot plus owner-facing work modules:

- Snapshot: priority work, money made, lead source reporting, response speed, reviews, and ROI.
- Customers/Jobs and Inbox: AI lead capture, missed-call text back, CRM records, service matching, scheduling guidance, quote guidance, and follow-up.
- Reviews: review requests, review status, review funnel reporting, and future review response workflows.
- Marketing: simple client-side requests plus admin-side fulfillment, content drafts, campaigns, approvals, and future publishing integrations.
- SEO: simple client-side requests plus admin-side fulfillment, local SEO intake, website audits, keyword/service-area work, and future crawler integrations.

The navigation should expose these modules instead of every internal settings page. Internal setup pages still exist, but the owner should not need to understand the app's route structure.

## Folder Structure

```text
src/
  app/          Next.js routes, pages, layouts, and API route handlers.
  components/   Shared UI components used across multiple routes.
  features/     Product-module UI and feature-specific documentation.
  lib/          Pure helpers grouped by purpose.
  services/     Business logic, provider workflows, security, and observability.
  workers/      Separate BullMQ worker entrypoints for slow automation jobs.
  auth/         NextAuth configuration.
  types/        Project-wide TypeScript declarations.
  proxy.ts      Next.js API proxy/rate-limit hook. Must stay at src root.
  instrumentation.ts Next.js request error hook. Must stay at src root.
```

```text
src/lib/
  analytics/     Reporting, revenue, lead source, and response-speed helpers.
  config/        Environment, site URL, and integration status helpers.
  data/          Prisma client, CSV parsing, and demo data.
  domain/        Core CRM domain helpers such as leads, reviews, services, and missed-call assistant intake.
  growth/        Digital presence, growth readiness, and website audit helpers.
  integrations/  Provider adapters for email, SMS compliance, Stripe, and Twilio.
  security/      Admin and password-policy helpers.
```

## Boundaries

Pages should load data, call services, and render UI. Client components can call API routes for mutations, then refresh the route.

Services are the module-facing business layer. They should import from `src/lib` and expose stable concepts to pages and API routes. Product-facing module services live in `src/services/modules`.

`src/lib` remains useful for small pure helpers, provider adapters, formatting, validation, and reusable scoring functions. Request security and observability work belongs in `src/services/security` and `src/services/observability`. Avoid putting page-specific UI decisions in `src/lib`.

Shared CRM status strings live in `src/lib/domain/status.ts`. Prefer importing those constants for persisted status values such as leads, missed calls, missed-call assistant intakes, communications, jobs, billing, and appointments. Labels and UI-only status groupings can stay near the feature that renders them.

AI prompt assembly belongs in `src/services/ai`. Provider-specific HTTP calls also live there when they are part of a product workflow.

## Design Style

LeadReply uses a functional, module-first TypeScript style rather than classic object-oriented domain models. This fits Next.js well: pages coordinate route work, feature folders own screen-specific view logic, services own business workflows, and `lib` owns pure reusable helpers.

Object-oriented patterns are still useful at boundaries where LeadReply will swap providers or run long-lived workflows. Use small interfaces/classes for adapters such as SMS, email, billing, calendar, AI models, crawlers, and queue workers when they reduce coupling. Avoid introducing classes for ordinary React components, static copy, formatting, or one-page view models.

Good refactors should usually move code in this order:

- Page-specific display shaping into `src/features/<module>`.
- Reusable business rules into `src/services/<area>` or `src/services/modules`.
- Pure domain helpers into `src/lib/domain`, `src/lib/analytics`, or another focused `src/lib` folder.
- Provider-specific API calls behind adapter-style services so the UI does not know whether Twilio, Stripe, OpenAI, or another provider is underneath.

## Current Module Entry Points

- `src/services/modules/core.ts`
- `src/services/modules/leads.ts`
- `src/services/modules/reviews.ts`
- `src/services/modules/marketing.ts`
- `src/services/modules/seo.ts`
- `src/services/modules/analytics.ts`
- `src/services/admin/auth.ts`
- `src/services/admin/operations.ts`
- `src/services/admin/options.ts`
- `src/services/communications/missed-call-assistant-flow.ts`
- `src/services/communications/inbound-sms.ts`
- `src/services/communications/send-tracked-sms.ts`
- `src/services/communications/sms-messages.ts`
- `src/services/ai/industry-templates.ts`
- `src/services/ai/prompt-builder.ts`
- `src/services/ai/openai-missed-call-assistant.ts`
- `src/services/ai/growth-plan.ts`
- `src/services/security/rate-limit.ts`
- `src/services/security/request-security.ts`
- `src/services/security/security-events.ts`
- `src/services/observability/logger.ts`
- `src/services/observability/error-monitoring.ts`
- `src/services/observability/ai-usage.ts`
- `src/services/queue/client.ts`
- `src/services/queue/jobs.ts`
- `src/services/jobs/*`
- `src/workers/index.ts`

## UI Direction

LeadReply should feel calm, modern, and operational. Prefer fewer top-level buttons, clear module cards, compact metrics, and charts that connect activity to money. Avoid exposing implementation terms like "pipeline" unless the screen truly manages a sales pipeline.

## Integration Direction

Integrations should be added behind service/adaptor layers so the UI stays stable. The likely order is:

1. Twilio/phone/SMS production hardening.
2. Calendar scheduling integrations.
3. Google Business Profile and review integrations.
4. SEO data providers and crawler expansion.
5. Social posting and approval workflow.
6. Stripe billing and customer portal hardening.

Every integration needs manual fallback behavior for early clients and demos.

## Scaling Decisions

Add these before launch:

- Route-level rate limits for AI, auth, public widget, and webhook-like surfaces. Current implementation uses `src/proxy.ts` plus stricter route-level checks for especially sensitive endpoints.
- Provider signature verification for Twilio and Stripe. Stripe signatures include timestamp tolerance to reduce replay risk.
- Clear structured logging in the production host through `src/services/observability/logger.ts`.
- Basic request error capture through `src/instrumentation.ts`.
- Security event logging for signup, password reset, password change, billing actions, and admin client edits.
- AI usage logging for growth-plan and missed-call assistant OpenAI paths.
- Redis + BullMQ background jobs through `src/services/queue` and `src/workers/index.ts`.
- Admin-visible job history, retries, cancellation, attempts, and idempotency keys through `OpsJobRun`.

The worker is a separate production process from the Next.js web app. The web app creates an `OpsJobRun` row and adds a BullMQ job to Redis. The worker picks up the job, performs slow work, and updates `OpsJobRun` as `QUEUED`, `RUNNING`, `RETRYING`, `SUCCEEDED`, `FAILED`, or `CANCELLED`.

Security-sensitive routes write `SecurityEvent` records through `src/services/security/security-events.ts`. These records are best-effort audit logs for support and launch safety, not a place for secrets. They should include safe context such as actor email, user/business IDs, changed field names, status, request IP, and user agent.

Pre-launch queued jobs:

- Missed-call SMS text-back.
- Inbound missed-call assistant replies advance the intake synchronously, then queue the next outbound SMS.
- LeadReply missed-call assistant summary refinement.
- AI growth-plan generation.
- Website audits.
- Lead CSV imports.
- Owner email summaries.

Add these after real usage or before heavy automation:

- Redis-backed rate limits for multi-instance deployments.
- Dead-letter handling and richer queue dashboards once job volume grows.
- Browserless/Apify crawler scans, screenshots, and competitor scanning.
- More detailed cost monitoring for SMS, AI, email, crawling, and social publishing.
