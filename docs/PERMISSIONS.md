# LeadReply Permissions

Last updated: June 15, 2026

LeadReply has owner login accounts, tracked team members, login-capable
memberships, and expiring team invitations. Role rules are defined in
`src/lib/security/permissions.ts`; API and server-page access should go through
`src/services/auth/business-access.ts`.

## Business Roles

- `OWNER`: full access, including billing, plan changes, business profile, automation, phone lines, team, CRM, reviews, marketing, SEO, analytics, exports, and settings.
- `MANAGER`: daily operations access, but no billing or plan changes.
- `OFFICE`: receptionist/front-desk role for leads, customers, jobs, appointments, messages, notes, and reviews.
- `TECHNICIAN`: field-worker role for assigned job work, appointment details, messages, and job outcomes.
- `MARKETING`: growth role for SEO/marketing requests and reporting, without billing or core settings control.
- `VIEWER`: read-only reporting/settings visibility.
- `STAFF`: legacy role that maps to office/receptionist access.

## Invitation Rule

Owners invite users from LeadReply by choosing a role and permissions. LeadReply
generates a secure one-time token/link and optional code. Invitation links are
accepted at `/invite/[token]`; acceptance creates or connects a user and writes
an active `BusinessMembership`.

Invitations should:

- store only token/code hashes, never the raw secret
- expire after a short window, such as 7 days for email links or 24-48 hours for SMS/manual codes
- be revocable by the owner
- be single-use
- create or connect a `BusinessMembership` only after acceptance

The current invite-link flow is implemented. The numeric/manual code is stored
for a future code-entry screen and should not be treated as the primary path yet.

## Billing Rule

Only owners should be able to see or change billing, subscription, plan, Stripe portal, and payment settings.

Managers and staff should not be able to:

- Change plan.
- Open billing portal.
- See payment status beyond a simple "ask owner" prompt.
- Change Stripe customer/subscription metadata.

## Access Implementation

- Owner access uses `requireApiOwnerBusinessAccess` for billing, plan changes,
  team management, and destructive demo reset/clear actions.
- Business access uses `requireApiBusinessAccess(capability)` for business data
  APIs and `getBusinessAccessForSession(session, capability)` for server pages.
- Business data lookups should scope by `businessId: access.businessId`, not by
  `business.userId`, so invited staff can work inside the correct business.
- Personal account routes, such as password and theme preference, can still use
  the signed-in `session.user.id`.
- `/admin` remains separate from business roles and is controlled by
  `ADMIN_EMAILS`.

## Remaining Permission Work

1. Add the future manual invite-code entry screen.
2. Make the top app navigation permission-aware, not just the settings sidebar
   and route guards.
3. Add row-level ownership for future assigned technician jobs once assigned
   work exists.
4. Add automated tests for owner, manager, office, marketing, viewer, and
   unauthorized users.
