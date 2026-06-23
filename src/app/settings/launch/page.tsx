import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { isAdminEmail } from "@/lib/security/admin"
import { businessCategoryLabels, planLabels } from "@/lib/domain/business-options"
import {
  getIntegrationStatuses,
  getLaunchReadinessScore,
} from "@/lib/config/integration-status"
import { getGrowthReadinessStats } from "@/services/modules/seo"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { getBusinessAccessForSession } from "@/services/auth/business-access"
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

  const access = await getBusinessAccessForSession(session, "manageBusinessProfile")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
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
          growthTasks: true,
          marketingCalendarItems: true,
          serviceOpportunities: true,
          websiteAuditRuns: true,
          growthPlans: true,
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
  const growthStats = getGrowthReadinessStats(business)
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
      label: "Digital presence",
      ready: growthStats.digitalPresenceComplete,
      summary: `${growthStats.digitalPresenceReadyCount}/${growthStats.digitalPresenceTotalCount} presence items ready`,
      href: "/growth",
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
      label: "Automation rules",
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
    ...(growthStats.seoAccess
      ? [
          {
            label: "SEO setup",
            ready: growthStats.seoComplete,
            summary: `${growthStats.seoReadyCount}/${growthStats.seoTotalCount} SEO items ready`,
            href: "/growth",
          },
          {
            label: "SEO workbench",
            ready: business._count.growthTasks > 0,
            summary: `${business._count.growthTasks} saved growth task${
              business._count.growthTasks === 1 ? "" : "s"
            }`,
            href: "/growth",
          },
          {
            label: "Deep audit",
            ready: business._count.websiteAuditRuns > 0,
            summary: `${business._count.websiteAuditRuns} website audit${
              business._count.websiteAuditRuns === 1 ? "" : "s"
            } completed`,
            href: "/growth",
          },
          {
            label: "Growth plan",
            ready: business._count.growthPlans > 0,
            summary: `${business._count.growthPlans} generated growth plan${
              business._count.growthPlans === 1 ? "" : "s"
            }`,
            href: "/growth",
          },
        ]
      : []),
    ...(growthStats.marketingAccess
      ? [
          {
            label: "Marketing setup",
            ready: growthStats.marketingComplete,
            summary: `${growthStats.marketingReadyCount}/${growthStats.marketingTotalCount} marketing items ready`,
            href: "/growth",
          },
          {
            label: "Marketing calendar",
            ready: business._count.marketingCalendarItems > 0,
            summary: `${business._count.marketingCalendarItems} calendar item${
              business._count.marketingCalendarItems === 1 ? "" : "s"
            } planned`,
            href: "/growth",
          },
        ]
      : []),
  ]
  const requiredBusinessLabels = new Set([
    "Business profile",
    "Services",
    "Availability",
    "Automation rules",
  ])
  const missingRequiredProviders = statuses.filter(
    (item) => item.required && !item.configured
  )
  const businessBlockers = businessChecks.filter(
    (item) => !item.ready && requiredBusinessLabels.has(item.label)
  )
  const optionalLaunchItems = businessChecks.filter(
    (item) => !item.ready && !requiredBusinessLabels.has(item.label)
  )
  const launchIsBlocked =
    missingRequiredProviders.length > 0 || businessBlockers.length > 0
  const requiredProviderCount = statuses.filter((item) => item.required).length
  const configuredProviderCount = statuses.filter(
    (item) => item.required && item.configured
  ).length

  return (
    <SettingsShell>
        <section className="rounded-2xl bg-lr-primary p-5 text-lr-on-primary shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                Launch readiness
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {business.name} is {readinessScore}% ready for launch
              </h1>
              <p className="mt-3 max-w-2xl text-lr-on-primary/75">
                Connect the live providers, confirm the business setup, then
                clear CRM activity before onboarding the first client.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-lr-on-primary/75">Plan</p>
              <p className="mt-1 text-xl font-bold">
                {planLabels[business.selectedPlan] ?? "Basic"}
              </p>
              <p className="mt-1 text-sm text-lr-on-primary/75">
                {businessCategoryLabels[business.businessType] ?? "Business"}
              </p>
            </div>
          </div>
        </section>

        <section
          className={`mt-6 rounded-2xl border p-5 shadow-sm sm:p-6 ${
            launchIsBlocked
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p
                className={`text-sm font-semibold uppercase tracking-wide ${
                  launchIsBlocked ? "text-amber-800" : "text-emerald-800"
                }`}
              >
                Launch decision
              </p>
              <h2 className="mt-2 text-2xl font-bold text-lr-strong">
                {launchIsBlocked
                  ? "Not ready for real customer traffic yet."
                  : "Ready for a controlled launch."}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-lr-body">
                {configuredProviderCount}/{requiredProviderCount} required
                providers are configured. Clear the required provider and
                business blockers before connecting live SMS, billing, and
                customer traffic.
              </p>
            </div>
            <Link
              href={userIsAdmin ? "/admin#integrations" : "#provider-checklist"}
              className="inline-flex items-center justify-center rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover"
            >
              {userIsAdmin ? "Open admin checks" : "Review provider list"}
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-lr-surface p-4">
              <p className="text-sm font-bold text-lr-strong">
                Provider blockers
              </p>
              <div className="mt-3 space-y-2 text-sm text-lr-muted">
                {missingRequiredProviders.length === 0 ? (
                  <p>No required provider blockers.</p>
                ) : (
                  missingRequiredProviders.map((item) => (
                    <Link
                      key={item.key}
                      href="#provider-checklist"
                      className="block rounded-xl bg-lr-surface-muted px-3 py-2 hover:bg-lr-hover"
                    >
                      {item.label}: {item.missing.join(", ")}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-lr-surface p-4">
              <p className="text-sm font-bold text-lr-strong">
                Business blockers
              </p>
              <div className="mt-3 space-y-2 text-sm text-lr-muted">
                {businessBlockers.length === 0 ? (
                  <p>No required business blockers.</p>
                ) : (
                  businessBlockers.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-xl bg-lr-surface-muted px-3 py-2 hover:bg-lr-hover"
                    >
                      {item.label}: {item.summary}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-lr-surface p-4">
              <p className="text-sm font-bold text-lr-strong">
                Optional polish
              </p>
              <div className="mt-3 space-y-2 text-sm text-lr-muted">
                {optionalLaunchItems.length === 0 ? (
                  <p>All optional launch polish is complete.</p>
                ) : (
                  optionalLaunchItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-xl bg-lr-surface-muted px-3 py-2 hover:bg-lr-hover"
                    >
                      {item.label}: {item.summary}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            id="provider-checklist"
            className="rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-lr-strong">
                  Provider checklist
                </h2>
                <p className="mt-1 text-sm text-lr-muted">
                  Required providers are needed before real customer traffic.
                </p>
              </div>
              <Link
                href="/settings/automation"
                className="rounded-xl border border-lr-border-strong px-4 py-3 text-center text-sm font-semibold text-lr-strong hover:bg-lr-hover"
              >
                Automation setup
              </Link>
              {userIsAdmin && (
                <Link
                  href="/admin"
                  className="rounded-xl bg-lr-primary px-4 py-3 text-center text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover"
                >
                  Admin operations
                </Link>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {statuses.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lr-strong">
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
                          <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-muted">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-lr-muted">
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

          <div className="rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-lr-strong">
              Business checklist
            </h2>
            <div className="mt-5 space-y-3">
              {businessChecks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-2xl border border-lr-border p-4 hover:bg-lr-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lr-strong">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-sm text-lr-muted">
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
          <div className="rounded-2xl bg-lr-surface p-5 shadow-sm">
            <p className="text-sm text-lr-subtle">CRM records</p>
            <p className="mt-2 text-3xl font-bold text-lr-strong">
              {business._count.leads}
            </p>
            <p className="mt-1 text-sm text-lr-muted">Leads in workspace</p>
          </div>
          <div className="rounded-2xl bg-lr-surface p-5 shadow-sm">
            <p className="text-sm text-lr-subtle">Missed calls</p>
            <p className="mt-2 text-3xl font-bold text-lr-strong">
              {business._count.missedCalls}
            </p>
            <p className="mt-1 text-sm text-lr-muted">
              Calls ready for follow-up
            </p>
          </div>
          <div className="rounded-2xl bg-lr-surface p-5 shadow-sm">
            <p className="text-sm text-lr-subtle">Reviews</p>
            <p className="mt-2 text-3xl font-bold text-lr-strong">
              {business._count.reviewRequests}
            </p>
            <p className="mt-1 text-sm text-lr-muted">
              Review requests tracked
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-lr-strong">
            Deployment notes
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-lr-surface-muted p-4">
              <p className="font-bold text-lr-strong">Environment</p>
              <p className="mt-2 text-sm text-lr-muted">
                Add production env values for database, auth, Twilio, OpenAI,
                Stripe, and app URLs.
              </p>
            </div>
            <div className="rounded-2xl bg-lr-surface-muted p-4">
              <p className="font-bold text-lr-strong">Database</p>
              <p className="mt-2 text-sm text-lr-muted">
                Run Prisma migrations against the hosted PostgreSQL database.
              </p>
            </div>
            <div className="rounded-2xl bg-lr-surface-muted p-4">
              <p className="font-bold text-lr-strong">Webhooks</p>
              <p className="mt-2 text-sm text-lr-muted">
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
    </SettingsShell>
  )
}
