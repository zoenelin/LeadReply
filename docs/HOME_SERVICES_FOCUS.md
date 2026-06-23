# LeadReply Home-Services Focus

Last updated: June 15, 2026

LeadReply is now focused on home-service businesses first. The product should still be built with future vertical expansion in mind, but the launch experience, copy, onboarding, missed-call assistant intake, CRM defaults, and sales story should target home services.

## Launch Positioning

LeadReply is a simple home-services CRM built around AI lead capture.

The core promise:

- A customer calls, texts, or submits a lead.
- If the business misses it, LeadReply responds quickly.
- LeadReply asks the right service-specific questions.
- The owner or team sees the lead, job details, notes, messages, scheduling request, and next action in a simple CRM.

SEO and marketing are paid growth add-ons. They should feel like requests to LeadReply's team, not complex software the business owner has to operate alone.

## Initial Target Clients

Signup should ask for one home-service specialty:

- HVAC
- Plumbing
- Electrical
- Roofing
- Landscaping
- Cleaning
- Pest control
- Handyman
- Appliance repair
- Garage doors
- Painting
- Flooring
- Remodeling
- Junk removal
- Mobile detailing
- General home services

Older broad categories such as automotive, restaurants, and beauty may remain in code for compatibility and future expansion, but they should not be the primary launch experience.

## CRM Shape

The CRM should start with a generic home-services template:

- Leads
- Customers
- Jobs
- Appointments
- Messages
- Notes
- Reviews

The Customers/Jobs should evolve toward a Salesforce/Excel-style grid:

- Customizable columns
- Saved views
- Filters and search
- Statuses such as `NEW`, `CURRENT`, `SCHEDULED`, `CAPTURED`, and `CLOSED`
- A detail drawer or detail page for customer, job, appointment, message, and note context

The customizable "face" of the CRM must not replace the underlying normalized records. UI views can change, but core records should stay stable for AI, analytics, permissions, and reporting.

## AI Lead Capture

Every home-service specialty should have a service-aware intake template. The AI prompt should be built from:

- business profile
- selected home-service specialty
- service catalog
- availability rules
- phone routing and callback expectations
- quote rules and disclaimers
- approved business memory
- compliance guardrails

The AI may summarize, ask intake questions, and suggest next actions. It may not invent pricing, availability, licensing, warranties, emergency arrival times, discounts, or guarantees.

## Growth Add-Ons

Marketing and SEO are client requests that LeadReply can fulfill manually, automate, or both.

Client-side pages should stay simple:

- request an SEO audit
- request Google Business Profile help
- request campaign/content help
- provide approvals and business preferences
- see status and results

Admin-side pages should manage fulfillment:

- queue requests
- assign work
- draft content
- run audits
- log manual work
- track automation jobs
- report outcomes

## Security And Privacy Direction

LeadReply stores sensitive customer lead data. Before staff login launches, the foundation must support:

- tenant isolation by business
- owner-controlled invitations
- expiring invite links/codes
- role and capability presets
- audit logs for sensitive actions
- no cross-business AI context leakage
- owner-only billing and plan changes
- minimal staff access by default
