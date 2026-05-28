import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteDescription, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteName} | Missed Call Recovery CRM for Local Businesses`,
  description: siteDescription,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `${siteName} | Missed Call Recovery CRM`,
    description: siteDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    title: `${siteName} | Missed Call Recovery CRM`,
    description: siteDescription,
  },
};

const stats = [
  { label: "Missed calls", value: "0" },
  { label: "Texts sent", value: "0" },
  { label: "Review requests", value: "0" },
];

const steps = [
  "Capture a missed call",
  "Send a helpful reply",
  "Ask happy customers for reviews",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold text-slate-950">
            LeadReply
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-slate-950 px-4 py-2 text-white hover:bg-slate-800"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_420px] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Missed call recovery
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold text-slate-950 sm:text-5xl">
            LeadReply helps local businesses turn missed calls into booked
            conversations.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Start with a simple dashboard for missed calls, automatic text
            replies, and review requests. Keep the setup calm, focused, and easy
            to grow.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create your account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Dashboard preview
              </h2>
              <p className="mt-1 text-sm text-slate-500">Today</p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-950">Workflow</h2>
            <ol className="mt-3 space-y-2">
              {steps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
