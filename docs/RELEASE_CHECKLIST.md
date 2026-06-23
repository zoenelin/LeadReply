# LeadReply Release Checklist

Use this before putting a real business on LeadReply.

## Product Setup

- Confirm business profile, address, phone, website, category, and selected plan.
- Confirm digital presence status: website, Google profile, Facebook, Instagram, booking link, reviews, and brand assets.
- Fill out SEO and Marketing module setup when the business is on Growth or Complete.
- Run website audit V1 when a public client-owned website is saved.
- Generate a growth plan and review the tasks/calendar items it creates.
- Review future service opportunities for missing website, Google profile, social pages, reviews, booking, or brand assets.
- Create at least one SEO/Marketing workbench task and one marketing calendar item for Complete-plan clients.
- Configure services, appointment durations, estimate ranges, and bookable-online settings.
- Configure phone lines and routing targets for the selected plan.
- Configure each Twilio phone number's voice webhook to `/api/webhooks/twilio/voice`.
- Test fallback routing per plan: Basic one phone, Growth two phones, Complete three phones.
- Configure calendar or booking link notes.
- Configure automation guard rails for missed calls, quotes, scheduling, callbacks, and reviews.
- Confirm review link and Google Business Profile URL.
- Clear demo CRM activity from `/settings/launch`.

## Production Services

- Point `DATABASE_URL` to hosted PostgreSQL with backups enabled.
- Set strong production values for `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `APP_BASE_URL`.
- Set `ADMIN_EMAILS` to the real internal operator emails and confirm `/admin` rejects non-admin accounts.
- Add production OpenAI, Twilio, Stripe, Google, and email provider credentials.
- Configure Stripe products, price IDs, webhook endpoint, webhook secret, and customer portal.
- Complete Twilio business verification and SMS registration before production texting.
- Confirm Twilio voice status callbacks try all allowed phones before creating a missed call and queuing the automatic missed-call assistant text.
- Set up monitoring, error logging, uptime alerts, and backup checks.

## SEO And Web Basics

- Confirm page titles, descriptions, canonical URLs, Open Graph images, `sitemap.xml`, and `robots.txt`.
- Confirm the public homepage communicates LeadReply clearly.
- Confirm forms work on mobile widths and button targets are comfortable.
- Confirm light and dark appearance work across owner, settings, and admin pages.
- Confirm the app manifest and icons load.
- Confirm client-site audit does not target localhost, private IPs, or third-party pages without permission.

## Engineering Verification

```bash
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run lint
npm run test:smoke
npm run build
```

Smoke-test signup, login, dashboard, Customers/Jobs, missed calls, reviews, billing, SEO, Marketing, automation setup, and launch readiness in the browser after the build passes.

## Security Smoke Checks

- Change an account password from `/settings/security` and confirm a `PASSWORD_CHANGED` event appears in `/admin`.
- Request and complete a password reset without exposing the reset token in logs or admin UI.
- Change a billing plan and confirm `/admin` shows the safe billing activity event.
- Confirm planned team permissions keep billing owner-only before staff login is launched.
- Confirm repeated signup, password reset, and password-change attempts eventually return `429`.
- Confirm Stripe and Twilio webhooks reject invalid signatures.
