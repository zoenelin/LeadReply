import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { leadStatuses } from "@/lib/domain/status"
import {
  buildRevenueSummaryRows,
  formatResponseDuration,
  getResponseSpeedLabel,
  getResponseSpeedMessage,
  getResponseSpeedStats,
} from "@/services/modules/analytics"
import {
  LeadStatusFunnel,
  RevenueTrendChart,
  SourcePerformancePanel,
} from "@/features/analytics/AnalyticsCharts"
import { AnalyticsSummaryCards } from "@/features/analytics/AnalyticsSummaryCards"
import {
  getMissedCallAssistantStats,
  formatMoney,
} from "@/services/modules/core"
import { getGrowthReadinessStats } from "@/services/modules/marketing"
import { getReviewFunnelStats } from "@/services/modules/reviews"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AppNav } from "@/components/AppNav"
import {
  getSnapshotAnalytics,
  getSnapshotBusinessContent,
  getSnapshotLoopItems,
  getSnapshotModuleCards,
  getSnapshotWelcomeName,
} from "@/features/snapshot/snapshot-dashboard"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Snapshot",
  description: "LeadReply snapshot for leads, missed calls, reviews, and revenue.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "viewAnalytics")

  if (!access) {
    redirect("/settings/business")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    include: {
      _count: {
        select: {
          leads: true,
        },
      },
    },
  })
  const leadAnalytics = business
    ? await prisma.lead.aggregate({
        where: {
          businessId: business.id,
        },
        _sum: {
          capturedValueCents: true,
        },
      })
    : null
  const recoveredLeadAnalytics = business
    ? await prisma.lead.aggregate({
        where: {
          businessId: business.id,
          source: "MISSED_CALL",
          OR: [
            {
              status: leadStatuses.captured,
            },
            {
              status: leadStatuses.closed,
              capturedValueCents: {
                gt: 0,
              },
            },
          ],
        },
        _count: {
          _all: true,
        },
        _sum: {
          capturedValueCents: true,
        },
      })
    : null
  const missedCallLeadCount = business
    ? await prisma.lead.count({
        where: {
          businessId: business.id,
          source: "MISSED_CALL",
        },
      })
    : 0
  const dashboardLeads = business
    ? await prisma.lead.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          reviewRequests: true,
          missedCallAssistantIntakes: {
            orderBy: {
              updatedAt: "desc",
            },
            select: {
              status: true,
              quoteRequested: true,
              schedulingRequested: true,
              matchedServiceName: true,
            },
          },
        },
      })
    : []
  const responseCalls = business
    ? await prisma.missedCall.findMany({
        where: {
          businessId: business.id,
        },
      })
    : []
  const missedCallAssistantIntakes = business
    ? await prisma.missedCallAssistantIntake.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          missedCall: true,
          lead: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    : []
  const reviewRequests = business
    ? await prisma.reviewRequest.findMany({
        where: {
          businessId: business.id,
        },
      })
    : []
  const reviewRequestsCount = reviewRequests.length
  const capturedRevenueCents = leadAnalytics?._sum.capturedValueCents ?? 0
  const recoveredRevenueCents =
    recoveredLeadAnalytics?._sum.capturedValueCents ?? 0
  const recoveredLeadCount = recoveredLeadAnalytics?._count._all ?? 0
  const missedCallCaptureRate =
    missedCallLeadCount === 0
      ? 0
      : Math.round((recoveredLeadCount / missedCallLeadCount) * 100)
  const sourceRows = buildRevenueSummaryRows(dashboardLeads)
  const {
    activeSourceRows,
    cards: snapshotAnalyticsCards,
    monthRows,
    statusRows,
  } = getSnapshotAnalytics({
    leads: dashboardLeads,
    sourceRows,
    capturedRevenueCents,
  })
  const responseStats = getResponseSpeedStats(responseCalls)
  const reviewFunnelStats = getReviewFunnelStats(dashboardLeads)
  const missedCallAssistantStats = getMissedCallAssistantStats(missedCallAssistantIntakes)

  const dashboardContent = getSnapshotBusinessContent(business?.businessType)
  const selectedPlan = business?.selectedPlan ?? "BASIC"
  const growthStats = business ? getGrowthReadinessStats(business) : null
  const moduleCards = getSnapshotModuleCards({
    leadCount: business?._count.leads ?? 0,
    reviewRequestsCount,
    selectedPlan,
    growthStats,
  })
  const snapshotLoopItems = getSnapshotLoopItems({
    missedCallAssistantStats,
    reviewFunnelStats,
  })
  const welcomeName = getSnapshotWelcomeName({
    contactName: business?.contactName,
    sessionName: session.user.name,
    email: session.user.email,
  })
  const businessName = business?.name || "your business"

  return (
    <main className="min-h-screen bg-lr-page px-3 py-4 pb-10 sm:px-5 lg:px-8 md:pb-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />
      </div>

      <div className="mx-auto mt-5 max-w-[1600px] px-2 sm:px-0">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-3xl font-bold text-lr-strong">
              Welcome back, {welcomeName}
            </h1>
            <p className="mt-3 max-w-4xl text-lr-muted">
              Working with {businessName}. {dashboardContent.headline}{" "}
              {dashboardContent.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-xl border border-lr-border bg-lr-surface-muted px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Captured
              </p>
              <p className="mt-1 text-xl font-black text-lr-strong">
                {formatMoney(capturedRevenueCents)}
              </p>
            </div>
            <div className="rounded-xl border border-lr-border bg-lr-surface-muted px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Leads
              </p>
              <p className="mt-1 text-xl font-black text-lr-strong">
                {business?._count.leads ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-lr-border bg-lr-surface p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Lead flow
              </p>
              <h2 className="mt-2 text-2xl font-bold text-lr-strong">
                Capture, respond, follow up, and review.
              </h2>
            </div>
            <Link
              href="/leads"
              className="text-sm font-semibold text-lr-body hover:text-lr-strong"
            >
              Open Customers/Jobs
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshotLoopItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl bg-lr-surface-muted p-4 hover:bg-lr-hover"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-lr-strong">
                  {item.value}
                </p>
                <p className="mt-2 line-clamp-2 text-xs font-medium text-lr-muted">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {moduleCards.map((module) => (
            <Link
              key={module.label}
              href={module.href}
              className="group rounded-2xl border border-lr-border bg-lr-surface p-5 hover:border-lr-border-strong hover:bg-lr-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-lr-subtle">
                    {module.label}
                  </p>
                  <p className="mt-2 text-sm text-lr-muted">
                    {module.description}
                  </p>
                </div>
                <p className="rounded-lg bg-lr-hover px-3 py-1 text-sm font-bold text-lr-strong group-hover:bg-lr-surface">
                  {module.metric}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <section id="money-made" className="mt-10 scroll-mt-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-lr-accent">
                Money made
              </p>
              <h2 className="mt-2 text-3xl font-bold text-lr-strong">
                {formatMoney(capturedRevenueCents)} made
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-lr-body">
                Captured revenue from leads and missed-call follow-up.{" "}
                {formatMoney(recoveredRevenueCents)} came from missed-call leads,
                with {recoveredLeadCount} of {missedCallLeadCount} missed-call
                leads captured so far.
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border bg-lr-surface px-5 py-4 text-center shadow-sm shadow-lr-shadow/30">
              <p className="text-sm font-medium text-lr-subtle">
                Missed-call capture rate
              </p>
              <p className="mt-1 text-3xl font-bold text-lr-strong">
                {missedCallCaptureRate}%
              </p>
            </div>
          </div>

          <AnalyticsSummaryCards cards={snapshotAnalyticsCards} />

          <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <RevenueTrendChart months={monthRows} />
            <LeadStatusFunnel rows={statusRows} />
          </div>

          <div className="mt-4">
            <SourcePerformancePanel rows={activeSourceRows} />
          </div>
        </section>

        <div className="mt-8 rounded-2xl border border-lr-border p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-lr-subtle">
                Response speed
              </p>
              <h2 className="mt-2 text-2xl font-bold text-lr-strong">
                {formatResponseDuration(responseStats.averageMinutes)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-lr-muted">
                {getResponseSpeedMessage(responseStats)}
              </p>
            </div>
            <div className="rounded-2xl bg-lr-surface-muted px-5 py-4 text-center">
              <p className="text-sm font-medium text-lr-subtle">
                Speed rating
              </p>
              <p className="mt-1 text-xl font-bold text-lr-strong">
                {getResponseSpeedLabel(responseStats.averageMinutes)}
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
