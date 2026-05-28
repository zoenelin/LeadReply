# LeadReply Backlog

This file is for ideas we like but are not pulling into the current build yet. After each milestone, review this list, choose the strongest ideas, and brainstorm again before building.

## Current Backlog

- Weekly owner email: summarize leads, revenue, follow-ups, and missed opportunities.
- Import leads: upload a CSV from another CRM or spreadsheet.
- Export for accountant/bookkeeper: cleaner revenue report with date ranges.
- Staff permissions: owner/admin/staff roles for later multi-user accounts.
- Website embed script: replace the iframe snippet with a lightweight install script.
- Twilio delivery webhooks: update review and follow-up delivery status from carrier callbacks.
- Google Business Profile OAuth: pull profile and review data instead of only saving review links.
- Stripe customer portal: let businesses manage cards, invoices, and cancellations.
- Calendar integrations: Google Calendar, Square, Toast, Mindbody, Jane, and other booking systems.
- Production email: password reset, owner alerts, and weekly CRM summaries.
- Dependency security follow-up: revisit remaining moderate transitive advisories in Next/NextAuth/Prisma when non-breaking patched versions are available.

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
2. Import leads
3. Staff permissions
4. Accountant/bookkeeper export
5. Website embed script

## Completed From Backlog

- Lead quality score: estimates which leads are most likely to convert based on source, value, activity, AI intake, and appointment outcome.
- Notification center: shows new leads, missed calls, overdue follow-ups, AI intakes, sequence steps, and review prompts.
- Team notes: lets staff leave internal notes on a lead without changing customer-facing messages.
- Appointment outcome tracking: records booked, showed, no-show, rescheduled, or cancelled.
- Industry presets: adds starter services and availability for common business types.
- Website widget concept: adds a public "Text us" or "Request a callback" widget that creates Website leads.
- Demo data reset button: restores sample leads, missed calls, and review workflow.
- Missed-call to lead conversion: turns a missed call into a pipeline lead with one click.
- ROI card: shows recovered revenue from won missed-call leads.
- Lead source breakdown: compares missed calls, website, manual entries, and referrals.
- CSV export: downloads lead detail and revenue summary reports.
- Simple owner mode: gives owners a quiet daily view with one priority action.
- Response speed tracking: shows how quickly missed calls get replied to.
- Lost revenue tracker: shows likely revenue lost or at risk from lost leads, overdue follow-ups, and unanswered missed calls.
- Business health score: combines setup completeness, reply speed, follow-up habits, revenue risk, and review activity into a simple score.
- Lead intake form: gives each business a public form that creates Website leads in the CRM.
- Review funnel: tracks won customers to review requested to review received, with status updates and a dedicated reviews page.
- Follow-up sequences: creates a three-step text follow-up plan for leads, tracks draft/sent/skipped steps, and surfaces due steps on the dashboard, owner view, analytics, and lead detail page.
- AI missed-call concierge: runs the automatic text intake after a missed call, asks industry-specific questions, saves the transcript and answers, creates or updates the lead, and flags scheduling next steps.
- Launch readiness dashboard: checks required env providers, business setup, sample data cleanup, Stripe checkout readiness, and deployment notes.
- OpenAI concierge provider seam: can refine owner summaries while keeping deterministic scheduling and quote guard rails.
- Twilio SMS provider seam: sends review and follow-up texts when credentials are configured and falls back to manual tracking when not.
- Stripe checkout provider seam: creates subscription checkout sessions when live price IDs are configured.
- Public form rate limits: protects signup, public intake, and widget lead capture from simple abuse.
- Google review links: stores a business review link and appends it to review request messages.

## Later Integrations

- Twilio delivery webhooks
- Google Business Profile OAuth and review sync
- Stripe billing portal and invoice management
- Apple Business Connect
- Reservation systems
- Website embed script
- Native mobile app packaging
- Dependency security follow-up for remaining moderate transitive advisories
