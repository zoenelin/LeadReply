# LeadReply API Notes

Last updated: June 6, 2026

API route handlers live under `src/app/api`. The app uses Next.js App Router route handlers.

## Route Groups

Auth and account:

- `POST /api/signup`
- `/api/auth/[...nextauth]`
- `POST /api/password-reset/request`
- `POST /api/password-reset/confirm`
- `PATCH /api/account/password`
- `PATCH /api/account/appearance`

Business setup:

- `GET/PATCH /api/business`
- `PATCH /api/business/automation`
- `PATCH /api/business/calendar`
- `PATCH /api/business/digital-presence`
- `PATCH /api/business/growth`
- `PATCH /api/business/widget`

Core:

- `GET/POST /api/leads`
- `PATCH/DELETE /api/leads/[id]`
- `POST /api/leads/import`
- `POST /api/leads/[id]/follow-up-sequence`
- `PATCH /api/missed-calls/[id]`
- `GET/POST /api/services`
- `PATCH/DELETE /api/services/[id]`
- `GET /api/services/presets`
- `GET/POST /api/availability-windows`
- `PATCH/DELETE /api/availability-windows/[id]`
- `POST /api/phone-lines`
- `PATCH/DELETE /api/phone-lines/[id]`
- `GET/POST /api/intake/[businessId]`
- `GET /api/widget/[businessId]`
- `GET /widget.js`

Reviews:

- `GET/POST /api/review-requests`
- `PATCH /api/review-requests/[id]`

Growth, SEO, and marketing:

- `POST /api/website-audits/run`
- `POST /api/growth-plan/generate`
- `GET/POST /api/growth-tasks`
- `PATCH/DELETE /api/growth-tasks/[id]`
- `GET/POST /api/marketing-calendar`
- `PATCH/DELETE /api/marketing-calendar/[id]`

Analytics and exports:

- `GET /api/exports/leads`
- `GET /api/exports/revenue`

Billing and providers:

- `GET /api/billing`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/webhooks/stripe`
- `POST /api/webhooks/twilio/voice`
- `POST /api/webhooks/twilio/voice/status`
- `POST /api/webhooks/twilio/inbound`
- `POST /api/webhooks/twilio/status`

Twilio Voice missed-call flow:

- The voice webhook verifies the Twilio signature, matches the called number to an active `BusinessPhoneLine`, and forwards the call to the first active `BusinessPhoneRouteTarget`.
- The voice status webhook records every `PhoneCallRoutingAttempt`.
- If the first target is `busy`, `failed`, `no-answer`, or `canceled`, the status webhook returns TwiML to try the next active routing target allowed by the plan.
- Basic can try one routing phone, Growth can try two, and Complete can try three.
- After the final allowed target fails, LeadReply records a `MissedCall`, starts the missed-call assistant intake automatically when phone automation is enabled, links the routing attempts, and queues the first SMS through BullMQ.
- Recent duplicate callbacks from the same caller and phone line are deduped so the customer is not texted multiple times for one missed call.

Twilio inbound SMS:

- Signature verification runs before payload handling.
- STOP/START style compliance replies are handled immediately.
- Normal customer replies are recorded as `SmsMessage` rows, matched to the latest missed-call SMS thread when possible, and used to advance the missed-call assistant intake.
- Follow-up missed-call assistant questions are queued through BullMQ as `MISSED_CALL_TEXT_BACK` jobs instead of being sent directly from the webhook.

Twilio status callbacks:

- Delivery statuses update matching `SmsMessage` rows by provider message ID.
- Existing review request and follow-up delivery error fields are still updated for older workflows.

Demo and support:

- `POST /api/demo/reset`
- `POST /api/demo/clear`

Admin operations:

- `POST /api/admin/workers`
- `PATCH /api/admin/workers/[id]`
- `POST /api/admin/assignments`
- `PATCH /api/admin/assignments/[id]`
- `POST /api/admin/client-notes`
- `POST /api/admin/growth-tasks`
- `POST /api/admin/marketing-calendar`
- `POST /api/admin/job-runs`
- `PATCH /api/admin/job-runs/[id]`
- `POST /api/admin/job-runs/[id]/retry`
- `POST /api/admin/job-runs/[id]/cancel`
- `PATCH /api/admin/businesses/[id]`
- `PATCH /api/admin/content-drafts/[id]`

## Handler Rules

- Global API rate limits run through `src/proxy.ts`. Use stricter route-local limits when a route can spend money, send messages, create accounts, or trigger AI/crawler work.
- Authenticated owner routes should call `getServerSession(authOptions)` and scope all data by `session.user.id` or the user's `businessId`.
- Mutating routes should validate input with Zod where practical.
- Mutating browser-facing routes should call `rejectCrossSiteRequest(req)`.
- Provider webhooks should verify provider signatures before trusting payloads. Stripe signature checks include timestamp tolerance to reduce replay risk. Twilio callbacks use the configured app base URL plus sorted form fields.
- Caught errors should call `captureException` before returning friendly JSON. Uncaught request errors are captured by `src/instrumentation.ts`.
- Account, billing, and admin-sensitive routes should call `logSecurityEvent` with safe metadata so `/admin` can show recent security activity.
- AI routes should record usage through `recordAiUsage` so cost, errors, and feature adoption are visible in admin/reporting surfaces.
- Slow routes should enqueue BullMQ jobs instead of blocking the request. Current queued routes include lead import, website audit, growth-plan generation, missed-call text-back, missedCallAssistant AI refinement, and owner summary email.
- Queueable routes should return `202` with the `OpsJobRun` when work is accepted for background processing.
- API handlers should stay small. If a handler grows past basic validation, authorization, and persistence, move business logic into `src/services` or a lower-level `src/lib` helper.
- Admin route handlers use `src/services/admin` for authorization, mutation guards, logging, and operations persistence.
- Return clear JSON errors using stable status codes. Avoid leaking provider secrets, stack traces, or internal SQL details.
