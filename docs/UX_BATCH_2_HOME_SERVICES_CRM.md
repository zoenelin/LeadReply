# Batch 2 UX Plan: Home-Services CRM

Last updated: June 15, 2026

This batch defines the new LeadReply product shape before the live screens are rebuilt. The design direction is home-services-first, simple enough for non-technical business owners, and structured enough for future CRM, AI, worker, and admin growth.

## Product Position

LeadReply is a home-services CRM with AI lead capture as the core product.

The software should help owners and office staff:

- capture missed calls and web leads
- respond quickly with AI-assisted intake
- track customer work in a simple CRM grid
- record jobs, appointments, messages, and notes
- request reviews after work is done
- request SEO and marketing help from LeadReply
- see money made, response speed, lead sources, and work that needs attention

SEO and marketing should not feel like complicated software the client has to operate. The client asks for help, approves drafts, and sees results. LeadReply admin users handle manual fulfillment, automation, and provider work behind the scenes.

## Page Mockups

The live mockup route is:

`/design/home-services-crm`

This route is for internal review. It should not be linked from the public homepage or normal app navigation until we decide it belongs there.

## Owner Navigation

The owner side should stay centralized around:

- Snapshot
- Customers/Jobs
- Inbox
- Reviews
- Marketing
- SEO
- Settings

Settings should hold account/business setup, not duplicate the Marketing or SEO workspaces.

## Snapshot

Snapshot is the daily command center. It should answer:

- What happened since I last looked?
- What needs my attention?
- How much money did LeadReply help capture?
- Are we responding fast enough?
- Which source is bringing useful leads?

Snapshot should not repeat the same alerts in several places. One priority queue is enough.

## Customers/Jobs

Customers/Jobs should feel like a sharp, simple CRM spreadsheet.

Recommended default columns:

- Customer
- Service
- Status
- Next step
- Last activity
- Money made
- Assigned user

Recommended default views:

- New
- Current
- Scheduled
- Captured
- Closed

Future customization should be view-based:

- show/hide columns
- reorder columns
- saved filters
- saved views by role

The underlying records should remain normalized. Custom views should not turn the database into arbitrary spreadsheet blobs.

## Lead Detail

Lead detail should be minimal at first:

- customer and service summary
- missed-call assistant intake summary when present
- status and next action
- notes timeline with author and date
- messages and call history
- appointment/job section
- review request section after captured work

Removed or de-emphasized for now:

- lead quality score
- duplicate follow-up note fields
- campaign cost editing inside lead detail
- estimated value unless it comes from configured service data or a real recorded value

Marketing campaign and ROI management belongs in Marketing. Leads can link back to a campaign, but campaign setup should not live inside lead details.

## Inbox

Inbox should work like a split-pane work surface:

- left side: calls and message threads
- right side: selected conversation and missed-call assistant intake status
- draggable divider on desktop
- search and filters above the list
- no auto-selected call until the user chooses one

Missed-call assistant intake starts automatically from the phone workflow. There should not be a client-facing "start missed-call assistant intake" button.

## Reviews

Reviews should stay very simple:

- customers needing a review request
- customers with a request already sent
- customers who left a review
- customers who did not leave a review yet
- optional discount offer setting

The owner should be able to send or resend a request without understanding the automation underneath.

## Marketing And SEO

Client side:

- request SEO audit
- request Google Business Profile help
- request campaign help
- upload or connect business information
- approve drafts
- see progress and outcomes

Admin side:

- triage requests
- assign work
- draft content
- run audits
- log manual work
- trigger automation jobs
- report results

## Team And Permissions

Owner invites should generate one-time, expiring links or codes. The invitation should capture:

- invited name
- email or phone
- role
- permissions
- expiration
- status

Roles:

- Owner
- Manager
- Office / receptionist
- Technician
- Marketing
- Viewer

Only owners can manage billing, plan changes, and team access by default.

## Batch 3 Implementation Order

1. Rebuild the owner shell/navigation around the approved module structure.
2. Update signup to home-services-first copy and specialty selection.
3. Rework Customers/Jobs into the CRM grid model with simple saved views.
4. Rework lead detail around notes, next action, messages, job/appointment, and review request.
5. Simplify Inbox around automatic missed-call assistant intake.
6. Simplify Reviews.
7. Convert Marketing and SEO into request/approval workspaces.
8. Build the first staff invitation routes and owner-facing team invite flow.
9. Update admin to handle SEO/marketing fulfillment requests.
10. Add docs for the new folder, UI, API, and permission decisions.
