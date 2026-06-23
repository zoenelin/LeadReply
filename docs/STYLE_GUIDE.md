# LeadReply Style Guide

Last updated: June 11, 2026

LeadReply should feel professional, calm, modern, and operational. The product is for busy local business owners, so screens should favor clarity, confidence, and fast scanning over decoration.

The primary brand direction is **Executive Dark**: a premium dark CRM workspace with charcoal surfaces, crisp borders, blue/mint action accents, and sharper interface geometry. Light mode remains available, but it should feel like the secondary accessibility/daytime option rather than the main brand personality.

## Theme System

Use semantic LeadReply theme tokens instead of hardcoded neutral colors.

Preferred classes:

- Page background: `bg-lr-page`
- Main cards/panels: `bg-lr-surface`
- Quiet nested panels: `bg-lr-surface-muted`
- Hover surface: `hover:bg-lr-hover`
- Borders: `border-lr-border` or `border-lr-border-strong`
- Primary text: `text-lr-strong`
- Body text: `text-lr-body`
- Supporting text: `text-lr-muted`
- Small metadata: `text-lr-subtle`
- Primary actions: `bg-lr-primary text-lr-on-primary hover:bg-lr-primary-hover`
- Inputs: rely on global `input`, `select`, and `textarea` theme variables plus explicit `border-lr-border-strong`.

Do not use hardcoded neutral app-surface classes like `bg-white`, `bg-slate-50`, `text-slate-950`, or `border-slate-200` in app pages or reusable components.

## Light And Dark Mode

Theme values live in `src/app/globals.css`. The app stores the preference as:

- Database: `User.themePreference`
- Browser cookie/local storage: `leadreply-theme`

The root layout stays static-friendly and runs the theme script globally so saved `LIGHT` or `DARK` preferences from cookie/local storage are applied across every page. New users default to `DARK`.

## Visual Direction

- Keep navigation simple and module based.
- Favor sharper geometry: 4-6px controls and 8-10px panels. Avoid oversized rounded SaaS bubbles.
- Use cards for actual grouped tools, records, and repeated items.
- Avoid nested cards when a section layout is enough.
- Keep dashboards dense but not cramped.
- Make primary actions obvious and secondary actions quiet.
- Use concise headings and business-friendly wording.
- Prefer exact operational labels over vague product terms.
- Avoid decorative gradients, blobs, glassmorphism, and purely atmospheric art in the app shell.

## Future Polish

When the feature set settles, do a dedicated visual QA pass across:

- Homepage
- Signup/login/reset flows
- Dashboard
- Customers/Jobs and lead detail
- Inbox
- Reviews
- SEO and Marketing modules
- Snapshot reporting
- Settings
- Admin
