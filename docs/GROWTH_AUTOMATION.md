# Growth Automation Notes

This is the current LeadReply growth automation shape for the 7.5 launch version.

## What LeadReply Does Now

- Collects digital presence status for website, Google Business Profile, Facebook, Instagram, booking links, reviews, and brand assets.
- Turns missing digital presence pieces into `ServiceOpportunity` records for future setup or management upsells.
- Runs a permission-based website audit V1 against the saved public website URL.
- Stores audit runs and findings, then creates growth tasks from high and medium findings.
- Builds a rules-first growth plan from business memory, audit findings, lead data, SEO setup, and marketing setup.
- Uses OpenAI for growth plan refinement when `OPENAI_API_KEY` is configured.
- Logs AI usage in `AiUsageLog` so usage visibility can become part of the admin dashboard later.
- Creates growth tasks and approval-ready marketing calendar ideas from generated plans.

## What The Audit Checks

- Page title and meta description.
- H1/H2 heading structure.
- Mobile viewport tag.
- Click-to-call or visible phone path.
- Lead form presence.
- Booking, scheduling, quote, or reservation language.
- Review/testimonial trust signals.
- Local city/state language.
- Primary service terms from SEO setup.

## Safety Boundaries

- The audit is for the client's own public website only.
- Localhost, private IPs, `.local`, `.internal`, and `.test` targets are blocked.
- Social platforms, Google search pages, and competitor pages should not be scraped directly in V1.
- Later Google/Facebook/Instagram data should come from official APIs or connected accounts when possible.

## Later Upgrade Path

- Add Browserless or Apify for JavaScript rendering, screenshots, competitor scans, and larger crawl jobs.
- Add Google Business Profile OAuth and review sync.
- Add Search Console and Analytics reporting.
- Add social profile connection and approved publishing workflows.
- Add per-business AI spend caps and admin usage dashboards.
