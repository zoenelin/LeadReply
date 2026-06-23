# LeadReply Database Notes

Last updated: June 15, 2026

LeadReply uses Prisma with PostgreSQL. The schema lives in `prisma/schema.prisma`, and migrations live in `prisma/migrations`.

## Ownership Model

`User` currently owns one `Business` for the owner signup flow. `Business` is the tenant-style record. Most product data belongs to a business and should include `businessId`. `User.themePreference` stores the account appearance preference.

`BusinessMembership` is the future staff-login bridge. It lets one user belong to a business with a role, status, and optional permissions without replacing the current owner flow. Each existing owner gets an active owner membership.

`TeamInvitation` stores owner-created expiring invites. Store only hashes for invite tokens/codes. Raw invite secrets should only be shown or sent once.

Core related records:

- `Lead`: captured customer opportunity, status, source, estimated value, captured value, campaign cost, appointment state, and follow-up fields.
- `MissedCall`: missed caller record that can convert into a lead, link to the line that received the call, and link to the routing attempts that failed before text-back.
- `MissedCallAssistantIntake`: AI/rules intake state for missed-call conversations.
- `SmsMessage`: inbound and outbound SMS history, provider IDs, delivery status, errors, and links back to missed calls, missed-call assistant intakes, businesses, and queue jobs. Missed-call assistant, review-request, and follow-up texts should all use this table.
- `ServiceOffering`: services, estimate ranges, duration, and bookability.
- `AvailabilityWindow`: basic scheduling availability rules.
- `FollowUpStep`: planned or sent follow-up messages.
- `BusinessPhoneLine`: LeadReply/business phone lines, provider IDs, plan limits, and the default primary routing target.
- `BusinessPhoneRouteTarget`: ordered fallback phones for a line. Basic supports one active route target, Growth supports two, and Complete supports three.
- `PhoneCallRoutingAttempt`: one row per Twilio dial attempt so owners/admin can see which phone was tried, whether it answered, and which attempts led to a final missed call.

Reviews related records:

- `ReviewRequest`: review request status, delivery fields, sent date, received date, and optional lead link.

Growth related records:

- `GrowthTask`: presence, SEO, marketing, and general launch work.
- `MarketingCalendarItem`: campaign and social content planning.
- `ServiceOpportunity`: future paid setup or managed-service opportunity.
- `WebsiteAuditRun`: website audit result summary.
- `WebsiteAuditFinding`: individual audit issues and recommendations.
- `GrowthPlan`: generated plan, business memory, recommendations, and AI metadata.
- `AiUsageLog`: feature-level AI usage tracking.

Operations and compliance records:

- `InternalWorker`: LeadReply-side workers, roles, and availability status.
- `InternalTaskAssignment`: admin-only client setup, SEO, marketing, review, billing, support, and automation tasks.
- `InternalClientNote`: admin-only client notes for support, setup, sales, billing, SEO, and marketing context.
- `OpsJobRun`: manual and queued background job status for audits, imports, AI plans, SMS jobs, owner summaries, retries, and cancellation.
- `SecurityEvent`: account, billing, password reset, signup, and admin-sensitive activity for internal audit visibility. Do not store passwords, reset tokens, payment details, or raw provider secrets here.
- `PasswordResetToken`
- `EmailLog`
- `SmsOptOut`
- `TeamMember`: current tracked staff record, now with optional `userId`, permission JSON, invite timestamps, and accepted timestamp for future linking.
- `BusinessMembership`
- `TeamInvitation`
- `TeamNote`

## Data Rules

- Do not delete user-owned data unless the user clearly asks for it.
- Prefer soft status fields for work states, for example `DRAFT`, `TODO`, `COMPLETED`, `SENT`, or `RECEIVED`.
- Use `onDelete: Cascade` only where child records should naturally disappear with the parent business or lead.
- Use `onDelete: SetNull` when history should survive a removed relationship, such as provider logs or converted references.
- Money is stored in cents.
- External provider IDs should be stored as strings and default to empty strings until connected.
- Customer-facing queued jobs should use `dedupeKey` so retries or double-clicks do not send duplicate SMS/email.
- `OpsJobRun.payload` and `OpsJobRun.result` are JSON fields for worker context and admin-visible history. Do not expose raw payloads in owner UI.
- `SecurityEvent.metadata` is for small safe context such as changed field names or selected plan. Never store raw credentials, card data, reset tokens, message bodies that are not needed for auditing, or full provider payloads.

## Migration Workflow

After schema changes:

```bash
npx prisma format
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run lint
npm run build
```

For local development, create a real migration rather than relying on `db push` once the change should be kept.
