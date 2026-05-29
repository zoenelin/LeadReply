# LeadReply Release Checklist

Use this before putting a real business on LeadReply.

## Product Setup

- Confirm business profile, address, phone, website, category, and selected plan.
- Fill out Growth setup for SEO and marketing when the business is on Growth or Complete.
- Configure services, appointment durations, estimate ranges, and bookable-online settings.
- Configure calendar or booking link notes.
- Configure automation guard rails for missed calls, quotes, scheduling, callbacks, and reviews.
- Confirm review link and Google Business Profile URL.
- Clear demo CRM activity from `/settings/launch`.

## Production Services

- Point `DATABASE_URL` to hosted PostgreSQL with backups enabled.
- Set strong production values for `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `APP_BASE_URL`.
- Add production OpenAI, Twilio, Stripe, Google, and email provider credentials.
- Configure Stripe products, price IDs, webhook endpoint, and customer portal.
- Complete Twilio business verification and SMS registration before production texting.
- Set up monitoring, error logging, uptime alerts, and backup checks.

## SEO And Web Basics

- Confirm page titles, descriptions, canonical URLs, Open Graph images, `sitemap.xml`, and `robots.txt`.
- Confirm the public homepage communicates LeadReply clearly.
- Confirm forms work on mobile widths and button targets are comfortable.
- Confirm the app manifest and icons load.

## Engineering Verification

```bash
npx prisma validate
npx prisma migrate deploy
npm run lint
npm run test:smoke
npm run build
```

Smoke-test signup, login, dashboard, Lead Center, missed calls, reviews, billing, Growth setup, automation setup, and launch readiness in the browser after the build passes.
