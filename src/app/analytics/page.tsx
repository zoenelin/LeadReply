import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { businessCategoryLabels } from "@/lib/business-options"
import { getBusinessHealthStats } from "@/lib/business-health"
import { getConciergeStats } from "@/lib/concierge-intake"
import { getAverageLeadValueCents, getStarterLeads } from "@/lib/demo-data"
import {
  getFollowUpSequenceMessage,
  getFollowUpSequenceStats,
} from "@/lib/follow-up-sequences"
import {
  formatMoney,
  leadSourceLabels,
  leadSourceOptions,
  leadStatusLabels,
  leadStatusOptions,
  statusClassName,
} from "@/lib/lead-options"
import {
  getLostRevenueLabel,
  getLostRevenueMessage,
  getLostRevenueStats,
} from "@/lib/lost-revenue"
import { prisma } from "@/lib/prisma"
import {
  formatResponseDuration,
  getResponseSpeedLabel,
  getResponseSpeedMessage,
  getResponseSpeedStats,
} from "@/lib/response-speed"
import { getReviewFunnelStats } from "@/lib/review-funnel"
import { buildRevenueSummaryRows } from "@/lib/reporting"
import { AppNav } from "../components/AppNav"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Review LeadReply lead, revenue, response, and review analytics.",
  robots: {
    index: false,
    follow: false,
  },
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getLastSixMonths() {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentMonth)
    date.setMonth(currentMonth.getMonth() - (5 - index))

    return {
      key: monthKey(date),
      label: date.toLocaleString("en-US", { month: "short" }),
    }
  })
}

async function getBusinessWithLeads(userId: string) {
  return prisma.business.findUnique({
    where: {
      userId,
    },
    include: {
      leads: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          reviewRequests: true,
        },
      },
      missedCalls: {
        orderBy: {
          createdAt: "asc",
        },
      },
      followUpSteps: {
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            stepOrder: "asc",
          },
        ],
      },
      conciergeIntakes: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      _count: {
        select: {
          reviewRequests: true,
        },
      },
    },
  })
}

type AnalyticsPageProps = {
  searchParams?: Promise<{
    source?: string
    status?: string
    start?: string
    end?: string
  }>
}

function parseFilterDate(value: string | undefined, endOfDay = false) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  let business = await getBusinessWithLeads(session.user.id)

  if (!business) {
    redirect("/settings/business")
  }

  if (business.leads.length === 0) {
    await prisma.lead.createMany({
      data: getStarterLeads(business.id, business.businessType),
    })

    const refreshedBusiness = await getBusinessWithLeads(session.user.id)
    if (refreshedBusiness) {
      business = refreshedBusiness
    }
  }

  const filters = (await searchParams) ?? {}
  const selectedSource = filters.source ?? "ALL"
  const selectedStatus = filters.status ?? "ALL"
  const startDate = parseFilterDate(filters.start)
  const endDate = parseFilterDate(filters.end, true)
  const exportParams = new URLSearchParams()

  if (selectedSource !== "ALL") {
    exportParams.set("source", selectedSource)
  }

  if (selectedStatus !== "ALL") {
    exportParams.set("status", selectedStatus)
  }

  if (filters.start) {
    exportParams.set("start", filters.start)
  }

  if (filters.end) {
    exportParams.set("end", filters.end)
  }

  const exportQuery = exportParams.toString()
  const leadExportHref = `/api/exports/leads${
    exportQuery ? `?${exportQuery}` : ""
  }`
  const revenueExportHref = `/api/exports/revenue${
    exportQuery ? `?${exportQuery}` : ""
  }`
  const leads = business.leads.filter((lead) => {
    const sourceMatches =
      selectedSource === "ALL" || lead.source === selectedSource
    const statusMatches =
      selectedStatus === "ALL" || lead.status === selectedStatus
    const startMatches = !startDate || lead.createdAt >= startDate
    const endMatches = !endDate || lead.createdAt <= endDate

    return sourceMatches && statusMatches && startMatches && endMatches
  })
  const responseCalls = business.missedCalls.filter((call) => {
    const startMatches = !startDate || call.createdAt >= startDate
    const endMatches = !endDate || call.createdAt <= endDate

    return startMatches && endMatches
  })
  const responseStats = getResponseSpeedStats(responseCalls)
  const lostRevenueStats = getLostRevenueStats({
    leads,
    missedCalls: responseCalls,
    missedCallValueCents: getAverageLeadValueCents(business.businessType),
  })
  const businessHealthStats = getBusinessHealthStats({
    business,
    leads,
    missedCalls: responseCalls,
    reviewRequestCount: business._count.reviewRequests,
    missedCallValueCents: getAverageLeadValueCents(business.businessType),
  })
  const wonLeads = leads.filter((lead) => lead.status === "WON")
  const lostLeads = leads.filter((lead) => lead.status === "LOST")
  const openLeads = leads.filter(
    (lead) => lead.status !== "WON" && lead.status !== "LOST"
  )
  const revenueWonCents = wonLeads.reduce(
    (total, lead) => total + lead.wonValueCents,
    0
  )
  const pipelineCents = openLeads.reduce(
    (total, lead) => total + lead.estimatedValueCents,
    0
  )
  const lostOpportunityCents = lostLeads.reduce(
    (total, lead) => total + lead.estimatedValueCents,
    0
  )
  const recoveredRevenueCents = wonLeads
    .filter((lead) => lead.source === "MISSED_CALL")
    .reduce((total, lead) => total + lead.wonValueCents, 0)
  const missedCallLeads = leads.filter((lead) => lead.source === "MISSED_CALL")
  const recoveredLeadCount = missedCallLeads.filter(
    (lead) => lead.status === "WON"
  ).length
  const missedCallWinRate =
    missedCallLeads.length === 0
      ? 0
      : Math.round((recoveredLeadCount / missedCallLeads.length) * 100)
  const sourceRows = buildRevenueSummaryRows(leads)
  const maxSourceLeads = Math.max(
    ...sourceRows.map((source) => source.leadCount),
    1
  )
  const maxSourceRevenue = Math.max(
    ...sourceRows.map((source) => source.revenueCents),
    1
  )
  const bestSource = [...sourceRows]
    .filter((source) => source.leadCount > 0)
    .sort(
      (left, right) =>
        right.revenueCents - left.revenueCents ||
        right.leadCount - left.leadCount
    )[0]
  const conversionRate =
    leads.length === 0 ? 0 : Math.round((wonLeads.length / leads.length) * 100)
  const monthRows = getLastSixMonths().map((month) => {
    const monthLeads = leads.filter((lead) => monthKey(lead.createdAt) === month.key)
    const monthRevenueCents = monthLeads.reduce(
      (total, lead) => total + lead.wonValueCents,
      0
    )

    return {
      ...month,
      leads: monthLeads.length,
      revenueCents: monthRevenueCents,
    }
  })
  const maxMonthlyLeads = Math.max(
    ...monthRows.map((month) => month.leads),
    1
  )
  const maxMonthlyRevenue = Math.max(
    ...monthRows.map((month) => month.revenueCents),
    1
  )
  const statusRows = ["NEW", "CONTACTED", "WON", "LOST"].map((status) => ({
    status,
    label: leadStatusLabels[status],
    count: leads.filter((lead) => lead.status === status).length,
  }))
  const recentLeads = [...leads]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 6)
  const lostRevenuePreviewItems =
    lostRevenueStats.actionItems.length > 0
      ? lostRevenueStats.actionItems.slice(0, 3)
      : lostRevenueStats.lostItems.slice(0, 3)
  const reviewFunnelStats = getReviewFunnelStats(leads)
  const leadIdsInView = new Set(leads.map((lead) => lead.id))
  const followUpSequenceStats = getFollowUpSequenceStats(
    business.followUpSteps.filter((step) => leadIdsInView.has(step.leadId))
  )
  const conciergeStats = getConciergeStats(business.conciergeIntakes)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Analytics
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Leads captured and money made
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                {business.name} is tracking{" "}
                {businessCategoryLabels[business.businessType] ?? "business"}{" "}
                leads from missed calls, website requests, referrals, and manual
                entries.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link
                href="/leads"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Open pipeline
              </Link>
              <a
                href={leadExportHref}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Export leads
              </a>
              <a
                href={revenueExportHref}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Export revenue
              </a>
            </div>
          </div>

          <form
            action="/analytics"
            className="mt-8 grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <select
              name="source"
              defaultValue={selectedSource}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="ALL">All sources</option>
              {leadSourceOptions.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="ALL">All statuses</option>
              {leadStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="start"
              defaultValue={filters.start ?? ""}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              type="date"
              name="end"
              defaultValue={filters.end ?? ""}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply filters
            </button>
          </form>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Leads captured</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {leads.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Money made</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatMoney(revenueWonCents)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Conversion rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {conversionRate}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Open pipeline</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatMoney(pipelineCents)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Lost opportunity</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatMoney(lostOpportunityCents)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Average response time</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatResponseDuration(responseStats.averageMinutes)}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {getResponseSpeedLabel(responseStats.averageMinutes)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Same-day replies</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {responseStats.sameDayRate}%
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {responseStats.repliedCount} replied missed call
                {responseStats.repliedCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Waiting for reply</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {responseStats.waitingCount}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {responseStats.oldestWaitingMinutes === null
                  ? "All clear"
                  : `Oldest: ${formatResponseDuration(
                      responseStats.oldestWaitingMinutes
                    )}`}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">
              Response speed tracking
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {getResponseSpeedMessage(responseStats)}
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-800">
                  AI missed-call concierge
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {conciergeStats.totalCount} intake
                  {conciergeStats.totalCount === 1 ? "" : "s"} started
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-700">
                  Tracks the missed-call text intake flow that gathers customer
                  details and flags scheduling needs after missed calls.
                </p>
              </div>
              <Link
                href="/missed-calls"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Open inbox
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">In progress</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {conciergeStats.inProgressCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Ready for owner</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {conciergeStats.readyCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Scheduling needed</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {conciergeStats.schedulingRequestedCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Quotes requested</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {conciergeStats.quoteRequestedCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {conciergeStats.completedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Business health score
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {businessHealthStats.score}/100 - {businessHealthStats.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {businessHealthStats.message}
                </p>
              </div>
              <Link
                href={businessHealthStats.weakestFactor.href}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Improve score
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {businessHealthStats.factors.map((factor) => (
                <Link
                  key={factor.label}
                  href={factor.href}
                  className="rounded-xl bg-slate-50 p-4 hover:bg-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {factor.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {factor.score}/{factor.maxScore}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {factor.status}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Review funnel
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {reviewFunnelStats.requestRate}% request rate
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {reviewFunnelStats.receivedCount} review
                  {reviewFunnelStats.receivedCount === 1 ? "" : "s"} received
                  from {reviewFunnelStats.wonLeadCount} won customer
                  {reviewFunnelStats.wonLeadCount === 1 ? "" : "s"} in this
                  view.
                </p>
              </div>
              <Link
                href="/reviews"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Open reviews
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {reviewFunnelStats.funnelSteps.map((step) => (
                <div key={step.label} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {step.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {step.count}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width:
                          step.percent === 0
                            ? "0%"
                            : `${Math.max(8, step.percent)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
                  Follow-up sequences
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {followUpSequenceStats.completionRate}% handled
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-700">
                  {getFollowUpSequenceMessage(followUpSequenceStats)}
                </p>
              </div>
              <Link
                href="/leads"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Open leads
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Active sequences</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {followUpSequenceStats.activeSequenceCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Due today</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {followUpSequenceStats.dueTodayCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Sent</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {followUpSequenceStats.sentCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Skipped</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {followUpSequenceStats.skippedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-800">
                  Lost revenue tracker
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {formatMoney(lostRevenueStats.totalLostAndAtRiskCents)} in
                  lost or at-risk value
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-700">
                  {getLostRevenueMessage(lostRevenueStats)}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  {getLostRevenueLabel(lostRevenueStats)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Overdue follow-ups</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {formatMoney(lostRevenueStats.overdueLeadValueCents)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {lostRevenueStats.overdueLeadCount} lead
                  {lostRevenueStats.overdueLeadCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Missed-call risk</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {formatMoney(lostRevenueStats.staleMissedCallValueCents)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {lostRevenueStats.staleMissedCallCount} waiting too long
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Closed lost</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {formatMoney(lostRevenueStats.lostLeadValueCents)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {lostRevenueStats.lostLeadCount} lead
                  {lostRevenueStats.lostLeadCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {lostRevenuePreviewItems.length === 0 ? (
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                  Nothing is overdue or marked lost in the selected view.
                </div>
              ) : (
                lostRevenuePreviewItems.map((item) => (
                  <Link
                    key={`${item.label}-${item.id}`}
                    href={item.href}
                    className="block rounded-xl bg-white px-4 py-3 hover:bg-rose-100"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {item.label}: {item.description}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-950">
                        {formatMoney(item.valueCents)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
                  ROI card
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {formatMoney(recoveredRevenueCents)} recovered by LeadReply
                </h2>
                <p className="mt-2 text-sm text-slate-700">
                  Won revenue from missed-call leads. {recoveredLeadCount} of{" "}
                  {missedCallLeads.length} missed-call leads are won.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Missed-call win rate
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {missedCallWinRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Lead source breakdown
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Where leads and revenue come from
                  </h2>
                </div>
                <span className="w-fit rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {leads.length} leads
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {sourceRows.map((source) => (
                  <div
                    key={source.source}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {source.label}
                        </p>
                        <p className="text-sm text-slate-500">
                          {source.wonCount} won of {source.leadCount} total
                        </p>
                      </div>
                      <p className="text-right text-sm font-semibold text-slate-700">
                        {source.conversionRate}% won
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width:
                            source.leadCount === 0
                              ? "0%"
                              : `${Math.max(
                                  8,
                                  (source.leadCount / maxSourceLeads) * 100
                                )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-slate-500">Revenue</p>
                        <p className="font-semibold text-slate-950">
                          {formatMoney(source.revenueCents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pipeline</p>
                        <p className="font-semibold text-slate-950">
                          {formatMoney(source.pipelineCents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Lost value</p>
                        <p className="font-semibold text-slate-950">
                          {formatMoney(source.lostOpportunityCents)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Best source insight
              </p>
              {bestSource ? (
                <>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {bestSource.label}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This is currently the strongest source in the selected
                    view, with {formatMoney(bestSource.revenueCents)} won and{" "}
                    {bestSource.leadCount} leads captured.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  No source has leads in the selected view yet.
                </p>
              )}

              <div className="mt-6 space-y-4">
                {sourceRows.map((source) => (
                  <div key={source.source}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">
                        {source.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatMoney(source.revenueCents)}
                      </p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width:
                            source.revenueCents === 0
                              ? "0%"
                              : `${Math.max(
                                  8,
                                  (source.revenueCents / maxSourceRevenue) *
                                    100
                                )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Lead capture
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Last 6 months
                  </h2>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {leads.length} total
                </span>
              </div>
              <div className="mt-6 flex h-40 items-end gap-3 border-b border-slate-200 pb-3">
                {monthRows.map((month) => (
                  <div
                    key={month.key}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-slate-500">
                      {month.leads}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-emerald-500"
                      style={{
                        height:
                          month.leads === 0
                            ? "0%"
                            : `${Math.max(
                                10,
                                (month.leads / maxMonthlyLeads) * 100
                              )}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-6 gap-3 text-center text-xs font-medium text-slate-500">
                {monthRows.map((month) => (
                  <span key={month.key}>{month.label}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Money made
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Won lead value
                  </h2>
                </div>
                <span className="rounded-lg bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                  {formatMoney(revenueWonCents)}
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {monthRows.map((month) => (
                  <div
                    key={month.key}
                    className="grid grid-cols-[3rem_1fr_5rem] items-center gap-3"
                  >
                    <span className="text-sm font-medium text-slate-600">
                      {month.label}
                    </span>
                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width:
                            month.revenueCents === 0
                              ? "0%"
                              : `${Math.max(
                                  8,
                                  (month.revenueCents / maxMonthlyRevenue) *
                                    100
                                )}%`,
                        }}
                      />
                    </div>
                    <span className="text-right text-sm font-semibold text-slate-700">
                      {formatMoney(month.revenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Lead status
              </p>
              <div className="mt-4 space-y-3">
                {statusRows.map((row) => (
                  <div
                    key={row.status}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {row.label}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                        row.status
                      )}`}
                    >
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Recent leads
              </p>
              <div className="mt-4 divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="grid gap-2 py-4 sm:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr]"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {lead.customerName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {lead.customerPhone}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      {leadSourceLabels[lead.source] ?? lead.source}
                    </p>
                    <span
                      className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                        lead.status
                      )}`}
                    >
                      {leadStatusLabels[lead.status] ?? lead.status}
                    </span>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-950 sm:text-right"
                    >
                      {formatMoney(
                        lead.status === "WON"
                          ? lead.wonValueCents
                          : lead.estimatedValueCents
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
