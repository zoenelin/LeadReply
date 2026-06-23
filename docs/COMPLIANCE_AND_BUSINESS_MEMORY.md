# Compliance And Business Memory

LeadReply should save small businesses time. Owners should not have to answer a long setup interview when the information already exists on their website, Google profile, service menu, booking system, POS, CRM, or uploaded files.

## Product Principle

LeadReply gathers business information, turns it into draft memory, and asks the owner or LeadReply operator to approve the facts that are safe to reuse.

Approved memory can be used by:

- missed-call assistant summaries.
- Scheduling and quote guard rails.
- SEO setup and website audits.
- Marketing drafts and campaign planning.
- Admin setup work.

Rejected or unreviewed memory should not be treated as trusted AI context.

## Business Memory Flow

1. The owner or operator imports an existing source from `/settings/memory`.
2. Sources can be website copy, Google profile text, files/exports, API data, or owner notes.
3. LeadReply extracts draft `BusinessMemoryItem` records.
4. The owner or operator approves, rejects, or reopens each item.
5. Only approved items are injected into AI and growth-plan context.

This is V1. Later API connectors should create `BusinessMemorySource` records automatically.

Each uploaded file or pasted import is stored as its own `BusinessMemorySource`
so LeadReply can track where a fact came from. The first version supports
multiple text-like files at once. Larger PDFs, images, spreadsheets, websites,
and API syncs should be processed through background workers so importing never
slows down the customer-facing app.

The AI should not scan every raw source during a missed-call response. LeadReply
preprocesses sources into approved memory facts during setup, then fetches only
the approved facts needed for the business when a lead message arrives. That
keeps replies fast and makes owner-approved facts the trusted source of truth.

## Compliance Guardrails

Compliance guardrails are source-cited rules that apply by feature, industry, and state. They are not legal advice. They are safety constraints that help LeadReply avoid obvious risk while routing uncertain cases to owner/admin review.

Current rule areas:

- AI replies
- SMS
- Reviews
- Marketing
- SEO
- Booking
- Quotes

Current industries covered:

- Automotive
- Home services
- Beauty services
- Food/restaurants
- Medical/wellness
- Legal
- Fitness
- Real estate
- Professional services
- Retail
- Local business fallback

## State Handling

Every saved business state gets a state consumer-protection review guardrail. Higher-review privacy/data-use states also get a privacy/data-use review guardrail using the NCSL tracker as the source.

This is intentionally conservative. A future compliance update should add deeper state-specific legal, medical, real estate, contractor, restaurant, and privacy rules with attorney review.

## Sources Used In V1

- FTC advertising and marketing guidance: https://www.ftc.gov/business-guidance/advertising-marketing
- FTC endorsement guides: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- FCC TCPA rules: https://www.fcc.gov/sites/default/files/tcpa-rules.pdf
- HHS HIPAA marketing guidance: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/marketing/index.html
- HHS HIPAA appointment reminder FAQ: https://www.hhs.gov/hipaa/for-professionals/faq/286/are-appointment-reminders-allowed-under-hipaa-without-authorization/index.html
- ABA Model Rule 7.1: https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_7_1_communication_concerning_a_lawyer_s_services/
- HUD Fair Housing Act overview: https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview
- FDA food labeling and nutrition overview: https://www.fda.gov/food/food-labeling-nutrition
- NAAG consumer protection overview: https://www.naag.org/issues/consumer-protection/consumer-protection-101/
- NCSL state digital privacy law tracker: https://www.ncsl.org/technology-and-communication/state-laws-related-to-digital-privacy

## Future Work

- Add official Google Business Profile import.
- Add file parsing for PDFs, DOCX, XLSX, and images.
- Add provider connectors for Square, Toast, Shopify, Housecall Pro, Jobber, Mindbody, Jane, QuickBooks, and Google Calendar.
- Add admin-side memory cleanup tools for LeadReply staff.
- Add deeper state-specific rule packs with attorney review.
- Add rule versioning, reviewer, and last-reviewed metadata in the database.
