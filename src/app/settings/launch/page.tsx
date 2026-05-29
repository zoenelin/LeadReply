import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { isAdminEmail } from "@/lib/admin"
import { businessCategoryLabels, planLabels } from "@/lib/business-options"
import {
  getIntegrationStatuses,
  getLaunchReadinessScore,
} from "@/lib/integration-status"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { LaunchActionPanel } from "./LaunchActionPanel"

export const metadata: Metadata = {
  title: "Launch Readiness",
  description: "Check LeadReply provider setup, business setup, deployment notes, and launch cleanup.",
  robots: {
    index: false,
    follow: false,
  },
}

function statusClassName(ready: boolean) {
  return ready
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700"
}

function statusLabel(ready: boolean) {
  return ready ? "Ready" : "Needs setup"
}

export default async function LaunchSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          leads: true,
          missedCalls: true,
          reviewRequests: true,
          serviceOfferings: true,
          availabilityWindows: true,
          teamMembers: true,
        },
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const statuses = getIntegrationStatuses()
  const readinessScore = getLaunchReadinessScore(statuses)
  const userIsAdmin = isAdminEmail(session.user.email)
  const businessChecks = [
    {
      label: "Business profile",
      ready: Boolean(
        business.name &&
          business.phone &&
          business.address &&
          business.city &&
          business.state &&
          business.zip
      ),
      summary: `${business.name} in ${business.city || "city not set"}, ${
        business.state || "state not set"
      }`,
      href: "/settings/business",
    },
    {
      label: "Services",
      ready: business._count.serviceOfferings > 0,
      summary: `${business._count.serviceOfferings} service option${
        business._count.serviceOfferings === 1 ? "" : "s"
      } configured`,
      href: "/settings/services",
    },
    {
      label: "Availability",
      ready: business._count.availabilityWindows > 0,
      summary: `${business._count.availabilityWindows} availability window${
        business._count.availabilityWindows === 1 ? "" : "s"
      } configured`,
      href: "/settings/services",
    },
    {
      label: "Calendar setup",
      ready: Boolean(business.calendarProvider || business.calendarBookingUrl),
      summary:
        business.calendarProvider || business.calendarBookingUrl
          ? "Booking preferences are recorded"
          : "Calendar provider and booking link not set",
      href: "/settings/calendar",
    },
    {
      label: "Team access",
      ready: business._count.teamMembers > 0,
      summary: `${business._count.teamMembers} team member${
        business._count.teamMembers === 1 ? "" : "s"
      } added`,
      href: "/settings/team",
    },
    {
      label: "Automation guard rails",
      ready: Boolean(business.callbackTimeframe && business.quoteDisclaimer),
      summary: business.phoneAutomationEnabled
        ? "Missed-call automation is enabled"
        : "Missed-call automation is prepared but disabled",
      href: "/settings/automation",
    },
    {
      label: "Google review link",
      ready: Boolean(business.googleReviewUrl),
      summary: business.googleReviewUrl || "Review link not set",
      href: "/settings/automation",
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 pb-28 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                Launch readiness
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {business.name} is {readinessScore}% ready for launch
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Connect the live providers, confirm the business setup, then
                clear CRM activity before onboarding the first client.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-slate-300">Plan</p>
              <p className="mt-1 text-xl font-bold">
                {planLabels[business.selectedPlan] ?? "Basic"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {businessCategoryLabels[business.businessType] ?? "Business"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Provider checklist
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Required providers are needed before real customer traffic.
                </p>
              </div>
              <Link
                href="/settings/automation"
                className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Automation setup
              </Link>
              {userIsAdmin && (
                <Link
                  href="/admin"
                  className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Admin operations
                </Link>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {statuses.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {item.label}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                            item.configured
                          )}`}
                        >
                          {statusLabel(item.configured)}
                        </span>
                        {item.required && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.summary}
                      </p>
                    </div>
                    {item.missing.length > 0 && (
                      <p className="max-w-xs text-sm text-amber-700">
                        Missing: {item.missing.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Business checklist
            </h2>
            <div className="mt-5 space-y-3">
              {businessChecks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.summary}
                      </p>
                    </div>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                        item.ready
                      )}`}
                    >
                      {statusLabel(item.ready)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">CRM records</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {business._count.leads}
            </p>
            <p className="mt-1 text-sm text-slate-600">Leads in workspace</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Missed calls</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {business._count.missedCalls}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Calls ready for follow-up
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Reviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {business._count.reviewRequests}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Review requests tracked
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-950">
            Deployment notes
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-950">Environment</p>
              <p className="mt-2 text-sm text-slate-600">
                Add production env values for database, auth, Twilio, OpenAI,
                Stripe, and app URLs.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-950">Database</p>
              <p className="mt-2 text-sm text-slate-600">
                Run Prisma migrations against the hosted PostgreSQL database.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-950">Webhooks</p>
              <p className="mt-2 text-sm text-slate-600">
                Point Stripe webhooks to /api/webhooks/stripe, Twilio status
                callbacks to /api/webhooks/twilio/status, and inbound SMS to
                /api/webhooks/twilio/inbound after deployment.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <LaunchActionPanel />
        </div>
      </div>
    </main>
  )
}
