# LeadReply Flow Review

Last updated: June 20, 2026

## Client-Side Owner Flow

Primary navigation is centered around the modules a home-services business owner should understand:

- Snapshot
- Customers/Jobs
- Inbox
- Reviews
- Marketing
- SEO
- Settings

The owner flow is in a usable review state when local demo data has been seeded with `npm run seed:dev`.

### Snapshot

Snapshot should be the owner’s daily landing page. It now focuses on money made, lead flow, alerts, response speed, and module status. Setup/profile clutter should stay in Settings unless it is urgent work that needs action.

### Customers/Jobs

Customers/Jobs is the CRM workspace. It supports:

- Searching customers, services, phone numbers, notes, and source details.
- Filtering by all, needs attention, new, current, scheduled, completed, no follow-up, and closed.
- Sorting by newest, oldest, follow-up, money made, and name.
- Saved CRM views.
- Column customization.
- Hidden manual customer/job entry.
- Links into each customer/job detail page for notes and task work.

### Inbox

Inbox is the missed-call response surface. It should stay focused on calls/messages that need response or review. Automatic missed-call text-back work should happen from webhooks/background jobs, not manual “start missed-call assistant” buttons.

### Reviews

Reviews should stay simple:

- Customers needing a review request.
- Whether the request has been sent.
- Whether the review was received.
- Optional discount offer settings.

### Marketing And SEO

Marketing and SEO are service-request and workbench modules for now. The owner experience should avoid forcing small business owners to answer long strategic questionnaires when LeadReply can gather the information from business memory, websites, files, APIs, connected profiles, and admin work.

## Admin Flow

The admin flow starts at `/admin` and is gated by `ADMIN_EMAILS`.

Admin should support:

- Client list and client details.
- Internal notes.
- Internal assignments.
- LeadReply missed-call assistant review queue.
- Growth tasks.
- Marketing calendar/content approvals.
- Background job monitoring.
- Integration readiness.

The local dev seed creates example admin data so `/admin` is useful after a fresh database reset.

## Local Dev Stability

Use this sequence after a fresh local database:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed:dev
npm run build
npm run start
```

Use `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` to override the local seeded login. The seed script refuses non-local databases unless `ALLOW_NONLOCAL_SEED=true`.

## Still Needs Human Product Review

- Confirm whether Snapshot still has any repeated alerts or duplicate metrics after real use.
- Review Customers/Jobs columns and decide the default owner view.
- Review whether Marketing and SEO need even simpler owner request buttons.
- Review admin terminology before hiring staff so workers understand assignments and queues quickly.
- Decide whether demo data should be cleared from production-like environments automatically.
