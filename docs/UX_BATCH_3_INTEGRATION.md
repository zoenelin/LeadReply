# Batch 3 Integration Notes

Last updated: June 15, 2026

Batch 3 moves the home-services CRM direction from mockup into the working app.

## What Changed

- Signup now treats the business type step as a home-service specialty choice.
- Customers/Jobs is now a CRM-style grid with simple views, search, source filtering, sorting, manual lead entry, import, status updates, and a task-oriented open action.
- Lead quality scoring is intentionally absent from the owner-facing Customers/Jobs for now. The product should stay simple until a metric is accurate enough to be trusted.
- Marketing and SEO are now client request workspaces. Owners request work, see status, and approve marketing drafts instead of operating a complex marketing tool themselves.
- Optional Marketing/SEO details are behind a collapsed section so non-technical owners are not forced through a long setup flow.
- Team settings now generate secure expiring invite records with one-time token and code values. Raw invite secrets are only shown in the UI response, while hashes are stored in the database.
- `/invite/[token]` now exists so generated invite links do not land on a 404. Full staff account acceptance is still the next permissions build.

## Product Decisions

- LeadReply is home-services-first for launch.
- The CRM should feel spreadsheet-simple, but the data model should stay normalized so AI, analytics, permissions, and automations can grow safely.
- Business owners should not have to choose marketing channels or define every growth strategy. LeadReply should collect only useful preferences and handle strategy, drafts, automation, and manual work behind the scenes.
- SEO and marketing pages are not settings pages. They are client-facing work request and approval areas.
- Owner-only billing and plan controls remain separate from staff permissions.

## Next Technical Steps

1. Connect invite acceptance to real staff login and `BusinessMembership`.
2. Make server-side business lookup membership-aware instead of owner-only.
3. Add route-level permission guards so staff can only see allowed modules.
4. Add admin fulfillment views for SEO and marketing requests.
5. Continue simplifying lead detail, inbox, reviews, and dashboard from real user review.
