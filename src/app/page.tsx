import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteDescription, siteName } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `${siteName} | AI Lead Capture CRM for Home Services`,
  description: siteDescription,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `${siteName} | AI Lead Capture CRM for Home Services`,
    description: siteDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    title: `${siteName} | AI Lead Capture CRM for Home Services`,
    description: siteDescription,
  },
};

const stats = [
  { label: "Captured leads", value: "24", detail: "+18% this month" },
  { label: "Money tracked", value: "$8.4k", detail: "from follow-ups" },
  { label: "Reviews queued", value: "17", detail: "ready to request" },
];

const steps = [
  "A customer calls after hours",
  "LeadReply asks the right follow-up questions",
  "Your team sees the lead, value, and next step",
];

const businessTypes = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Cleaning",
  "Pest control",
];

const features = [
  {
    title: "Missed call recovery",
    description:
      "Capture callers, collect intent, and keep every lead organized before the day gets away from the team.",
  },
  {
    title: "Simple CRM tracking",
    description:
      "Track captured leads, follow-ups, appointments, reviews, and estimated revenue in one calm dashboard.",
  },
  {
    title: "Business optimization",
    description:
      "Give owners setup prompts for reviews, SEO, marketing, calendar links, services, and launch readiness.",
  },
];

const plans = [
  {
    name: "Basic",
    description: "Lead capture, missed calls, follow-ups, and reviews.",
  },
  {
    name: "Growth",
    description: "Everything in Basic plus SEO setup and local visibility prompts.",
  },
  {
    name: "Complete",
    description: "Everything in Growth plus marketing and social presence planning.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-lr-strong">
      <header className="sticky top-0 z-20 border-b border-lr-border bg-lr-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-black text-white">
              LR
            </span>
            <span>LeadReply</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-lr-muted md:flex">
            <a href="#how-it-works" className="hover:text-lr-strong">
              How it works
            </a>
            <a href="#features" className="hover:text-lr-strong">
              Features
            </a>
            <a href="#plans" className="hover:text-lr-strong">
              Plans
            </a>
          </nav>

          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-lr-body hover:bg-lr-hover"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-lr-primary px-4 py-2 text-lr-on-primary shadow-sm hover:bg-lr-primary-hover"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-lr-border bg-lr-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">
              All-in-one CRM for local businesses
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-normal text-lr-strong sm:text-6xl lg:text-7xl">
              LeadReply
            </h1>
            <p className="mt-5 max-w-2xl text-xl font-semibold leading-8 text-lr-strong">
              Turn missed calls into captured leads, booked follow-ups, review
              requests, and clear revenue tracking.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-lr-muted">
              Built for owners who need a simple command center for lead
              capture, customer follow-up, reviews, SEO setup, and marketing
              readiness without making the day more complicated.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-bold text-lr-strong hover:bg-lr-hover"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {businessTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-lg border border-lr-border bg-lr-surface-muted px-3 py-2 text-xs font-bold text-lr-muted"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-lr-border bg-lr-primary p-3 shadow-2xl shadow-lr-shadow sm:p-4">
            <div className="rounded-lg bg-lr-surface">
              <div className="flex items-center justify-between border-b border-lr-border px-4 py-4">
                <div>
                  <p className="text-xs font-bold uppercase text-lr-subtle">
                    Owner dashboard
                  </p>
                  <h2 className="mt-1 text-lg font-black text-lr-strong">
                    Lead command center
                  </h2>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  Live
                </span>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-lr-border bg-lr-surface-muted p-4"
                  >
                    <p className="text-xs font-bold uppercase text-lr-subtle">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-lr-strong">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 border-t border-lr-border p-4 lg:grid-cols-[1fr_260px]">
                <div className="rounded-lg border border-lr-border">
                  <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-lr-border px-4 py-3 text-xs font-bold uppercase text-lr-subtle">
                    <span>Lead</span>
                    <span>Status</span>
                  </div>
                  {[
                    ["Jordan P.", "Brake estimate", "Captured"],
                    ["Mia R.", "Dinner reservation", "Needs reply"],
                    ["Theo W.", "Roof leak", "Scheduled"],
                  ].map(([name, reason, status]) => (
                    <div
                      key={name}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-lr-border px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-bold text-lr-strong">
                          {name}
                        </p>
                        <p className="mt-1 text-sm text-lr-subtle">{reason}</p>
                      </div>
                      <span className="rounded-lg bg-lr-hover px-3 py-1 text-xs font-bold text-lr-body">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-lr-surface-muted p-4">
                  <h2 className="text-sm font-black text-lr-strong">
                    Setup progress
                  </h2>
                  <ol className="mt-4 space-y-3">
                    {steps.map((step, index) => (
                      <li
                        key={step}
                        className="grid grid-cols-[28px_1fr] items-start gap-3 text-sm"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <span className="leading-6 text-lr-body">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-16"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-emerald-700">
            Built for the real workday
          </p>
          <h2 className="mt-3 text-3xl font-black text-lr-strong sm:text-4xl">
            Capture, organize, and improve the business from the same place.
          </h2>
          <p className="mt-4 text-base leading-7 text-lr-muted">
            LeadReply starts with the most painful leak for local companies:
            missed calls. From there it grows into a practical CRM with the
            data owners need to see what is working.
          </p>
        </div>

        <div id="features" className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-lr-border bg-lr-surface p-5 shadow-sm"
            >
              <h3 className="text-lg font-black text-lr-strong">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-lr-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="plans" className="border-y border-lr-border bg-lr-surface">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-emerald-700">
              Plans
            </p>
            <h2 className="mt-3 text-3xl font-black text-lr-strong sm:text-4xl">
              Start simple, then add optimization as the business grows.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-lg border border-lr-border bg-lr-surface-muted p-5"
              >
                <h3 className="text-xl font-black text-lr-strong">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  Pricing coming soon
                </p>
                <p className="mt-4 text-sm leading-6 text-lr-muted">
                  {plan.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-lr-primary px-5 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
            >
              Set up LeadReply
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-lr-subtle sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-semibold">LeadReply</p>
        <nav className="flex flex-wrap gap-4 font-semibold">
          <Link href="/login" className="hover:text-lr-strong">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-lr-strong">
            Create account
          </Link>
          <Link href="/privacy" className="hover:text-lr-strong">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-lr-strong">
            Terms
          </Link>
          <Link href="/support" className="hover:text-lr-strong">
            Support
          </Link>
        </nav>
      </footer>
    </main>
  );
}
