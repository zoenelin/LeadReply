# LeadReply Security And Data Practices

Last updated: June 6, 2026

This is an engineering guide for how LeadReply should handle sensitive product data before launch.

## Current Guard Rails

- Auth uses NextAuth credentials with bcrypt password hashes.
- Passwords follow the shared policy in `src/lib/security/password-policy.ts`.
- Browser-facing mutation routes reject cross-site requests with `rejectCrossSiteRequest`.
- API rate limits run through `src/proxy.ts`, with stricter route-level limits for signup, password reset, password changes, AI-heavy jobs, public intake, and widget routes.
- Stripe and Twilio webhooks verify provider signatures before trusting payloads.
- Structured logs go through `src/services/observability/logger.ts`, which redacts common secret-like keys.
- Unhandled Next.js request errors go through `src/instrumentation.ts`.
- Security-sensitive account, billing, and admin actions write `SecurityEvent` records for `/admin`.

## Data Rules

- Store customer and business data only when it supports CRM, automation, reporting, billing, support, or legal/business requirements.
- Store money in cents.
- Store provider IDs and statuses, not raw credentials.
- Never store passwords, reset tokens, webhook signatures, card data, cookies, API keys, or authorization headers in logs, admin notes, job payloads, or `SecurityEvent.metadata`.
- Keep owner-facing screens scoped to the signed-in user's business.
- Keep internal-only details in `/admin` and restrict that route with `ADMIN_EMAILS`.

## Pre-Launch Requirements

- Hosted PostgreSQL with backups.
- Production `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `APP_BASE_URL`.
- Production `ADMIN_EMAILS`.
- Redis for BullMQ worker jobs.
- Stripe secret key, price IDs, webhook secret, webhook endpoint, and customer portal.
- Twilio credentials, sender, webhook URLs, and SMS registration.
- Email provider credentials for password resets and summaries.
- Error monitoring and uptime checks connected to production logs.

## Later Hardening

- Redis-backed distributed rate limits for multi-instance deployments.
- Dedicated error monitoring provider such as Sentry.
- More detailed security alerting for repeated failed logins, reset abuse, webhook failures, queue failures, and suspicious admin changes.
- Formal privacy policy, terms, data retention policy, vendor list, and incident-response process.
- Role-based admin permissions when internal workers need different access levels.
