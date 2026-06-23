# LeadReply Backlog

This file is for ideas we like but are not pulling into the current build yet. After each milestone, review this list, choose the strongest ideas, and brainstorm again before building.

## Current Backlog

- Weekly owner email: summarize leads, revenue, follow-ups, and missed opportunities.
- Export for accountant/bookkeeper: cleaner revenue report with date ranges.
- Google Business Profile OAuth: pull profile and review data instead of only saving review links.
- Live calendar sync: Google Calendar, Square, Toast, Mindbody, Jane, and other booking systems.
- Owner alerts and weekly CRM summaries through production email.
- Dependency security follow-up: revisit remaining moderate transitive advisories in Next/NextAuth/Prisma when non-breaking patched versions are available.
- Generate draft SEO page briefs and social captions from SEO and Marketing module setup after launch.
- Deep audit V2: extend the current website audit with official Google profile data, connected social profiles, screenshots, richer competitor positioning, and larger crawl volume.
- Revenue accuracy V2: replace the current captured-revenue fallback with exact recorded values from invoices, bookings, POS/payment integrations, or owner-confirmed job totals.
- Full staff login and permission enforcement: convert tracked team members into login-capable users, hide owner-only billing/plan settings from workers, and enforce role capabilities in API routes.

## Business, Legal, And Launch Operations

- Choose business structure, likely LLC, and confirm with a CPA or attorney.
- Register the business with the state.
- Get an EIN from the IRS.
- Open a business bank account.
- Set up bookkeeping/accounting.
- Decide final pricing and package details for Basic, Growth, and Complete.
- Create client onboarding agreement or master service agreement.
- Create Terms of Service.
- Create Privacy Policy.
- Create cancellation, refund, and support policies.
- Add SMS consent and opt-out language for missed-call follow-up texting.
- Add email marketing compliance language before sending marketing emails.
- Define data security, data deletion, access, backup, and incident response practices.
- Confirm HIPAA/medical-data boundaries before selling to medical or wellness businesses.
- Look into cyber liability and errors/omissions insurance.
- Choose and buy the production domain.
- Pick production hosting for the Next.js app.
- Pick managed PostgreSQL hosting and enable backups.
- Set up production environment variables and secret storage.
- Set up Stripe live subscriptions and customer portal.
- Set up Twilio business verification, toll-free or A2P 10DLC registration, and SMS opt-out handling.
- Set up OpenAI production API billing and usage limits.
- Set up production email provider for password resets, owner alerts, and summaries.
- Set up monitoring, error logging, uptime alerts, and backup checks.
- Create a support email and simple client support process.

## Brand And Design

- Create the LeadReply logo.
- Pick the company color palette.
- Define basic brand typography and button/UI style rules.
- Create simple social/profile assets from the final logo and colors.

## Maintenance And Engineering Documentation

- Add clear, useful code comments after the release feature set is complete.
- Refactor release code where it improves readability, ownership boundaries, and long-term maintenance.
- Document the website architecture, main user flows, and how the product pieces fit together.
- Document the folder structure so engineers can quickly find routes, API handlers, shared libraries, auth, Prisma, and UI components.
- Document common development tasks such as running the server, applying migrations, testing, adding pages, adding API routes, and changing provider integrations.
- Add a release-readiness engineering checklist for future updates.

## New Brainstorm Ideas

- Weekly owner email: summarize leads, revenue, follow-ups, and missed opportunities.
- Import leads: upload a CSV from another CRM or spreadsheet.
- Export for accountant/bookkeeper: cleaner revenue report with date ranges.
- Staff permissions: owner/admin/staff roles for later multi-user accounts.
- Client portal: let a business customer confirm appointments, upload details, and see request status.
- Saved automation rules: reusable rules for follow-up timing by business type.
- Call outcome tags: categorize why calls were missed and which ones convert best.
- Review response assistant: draft owner replies to good and bad reviews.
- Multi-location support: one account can manage several business locations.
- Launch wizard: convert the checklist into a guided stepper for first client onboarding.

## Suggested Pull Order

1. Weekly owner email
2. Accountant/bookkeeper export
3. Google Business Profile OAuth
4. Live calendar sync
5. Client portal

## Completed From Backlog

- Lead quality score: estimates which leads are most likely to convert based on source, value, activity, missed-call assistant intake, and appointment outcome.
- Notification center: shows new leads, missed calls, overdue follow-ups, missed-call assistant intakes, sequence steps, and review prompts.
- Team notes: lets staff leave internal notes on a lead without changing customer-facing messages.
- Appointment outcome tracking: records booked, showed, no-show, rescheduled, or cancelled.
- Industry presets: adds starter services and availability for common business types.
- Website widget concept: adds a public "Text us" or "Request a callback" widget that creates Website leads.
- Demo data reset button: restores sample leads, missed calls, and review workflow.
- Missed-call to lead conversion: turns a missed call into a Lead Center record with one click.
- ROI card: shows recovered revenue from captured missed-call leads.
- Lead source breakdown: compares missed calls, website, manual entries, and referrals.
- CSV export: downloads lead detail and revenue summary reports.
- Simple owner mode: gives owners a quiet daily view with one priority action.
- Response speed tracking: shows how quickly missed calls get replied to.
- Lost revenue tracker: shows likely revenue lost or at risk from lost leads, overdue follow-ups, and unanswered missed calls.
- Business health score: combines setup completeness, reply speed, follow-up habits, revenue risk, and review activity into a simple score.
- Lead intake form: gives each business a public form that creates Website leads in the CRM.
- Review funnel: tracks captured customers to review requested to review received, with status updates and a dedicated reviews page.
- Follow-up sequences: creates a three-step text follow-up plan for leads, tracks draft/sent/skipped steps, and surfaces due steps on the dashboard, owner view, analytics, and lead detail page.
- LeadReply missed-call assistant: runs the automatic text intake after a missed call, asks industry-specific questions, saves the transcript and answers, creates or updates the lead, and flags scheduling next steps.
- Launch readiness dashboard: checks required env providers, business setup, sample data cleanup, Stripe checkout readiness, and deployment notes.
- OpenAI missed-call assistant provider: can refine owner summaries while keeping deterministic scheduling and quote guard rails.
- Twilio SMS provider seam: sends review and follow-up texts when credentials are configured and falls back to manual tracking when not.
- Stripe checkout provider seam: creates subscription checkout sessions when live price IDs are configured.
- Public form rate limits: protects signup, public intake, and widget lead capture from simple abuse.
- Google review links: stores a business review link and appends it to review request messages.
- Password reset emails: stores secure reset tokens and sends reset links through production email when configured.
- Email delivery logs: records production email attempts for admin review.
- Stripe customer portal: lets subscribed businesses open Stripe-hosted card, invoice, and subscription management.
- Twilio delivery webhooks: verifies Twilio signatures and records carrier delivery failures for follow-ups and review requests.
- SMS opt-out handling: records STOP/START-style replies and blocks future texts to opted-out numbers.
- Website embed script: adds a lightweight script snippet that installs the floating LeadReply widget.
- CSV lead import: lets owners paste CRM/spreadsheet leads into LeadReply.
- Staff permissions setup: tracks team members, roles, and active/invited/disabled status.
- Calendar setup: stores provider, booking link, scheduling notes, and self-scheduling preference.
- Admin tools: adds an admin-only operations page for provider status, accounts, businesses, and email logs.
- Internal operations portal: adds `/admin` client management, worker assignments, client notes, content approval visibility, AI usage, integration health, plan management, and job tracking.
- Smoke test script: checks core public pages, SEO files, and widget script from the command line.
- Visual polish pass: improves navigation, focus states, spacing, and app-wide surface styling.
- SEO and Marketing module setup: stores structured search and campaign details, shows readiness counts, and connects those gaps to dashboard and launch checks.
- SEO and Marketing workbench: turns setup gaps into SEO actions, saved growth tasks, next-best dashboard prompts, and a marketing calendar with draft, approval, scheduled, and posted statuses.
- Digital presence setup: tracks website, Google profile, Facebook, Instagram, booking path, review destination, brand assets, and missing-piece setup help.
- Service opportunity tracking: turns missing website/social/Google/review/booking/brand items into future paid setup opportunities.
- Deep website audit V1: scans the saved public business website, scores SEO and conversion basics, stores findings, and creates growth tasks.
- Growth plan foundation: generates rules-first or OpenAI-assisted growth plans from business memory, audit findings, lead data, SEO, and marketing setup.
- Lead attribution expansion: tracks source detail, campaign name, campaign cost, and simple campaign ROI in Lead Center, analytics, and CSV exports.
- Marketing campaign management: moves campaign name, campaign cost, lead links, and campaign ROI into the Marketing module while Lead details only links to a campaign.

## Later Integrations

- Google Business Profile OAuth and review sync
- Apple Business Connect
- Live calendar and reservation-system sync
- Browserless or Apify-powered crawl expansion for JavaScript rendering, screenshots, competitor scanning, and larger audit volume.
- Native mobile app packaging
- Dependency security follow-up for remaining moderate transitive advisories
