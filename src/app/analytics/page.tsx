import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { businessCategoryLabels } from "@/lib/business-options"
import {
  formatMoney,
  leadSourceLabels,
  leadSourceOptions,
  leadStatusLabels,
  leadStatusOptions,
  statusClassName,
} from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../components/AppNav"

const averageLeadValues: Record<string, number> = {
  AUTOMOTIVE: 42000,
  HOME_SERVICES: 65000,
  BEAUTY_SERVICES: 12000,
  FOOD_SERVICES: 18000,
  MEDICAL_WELLNESS: 26000,
  LEGAL: 90000,
  FITNESS: 16000,
  REAL_ESTATE: 120000,
  PROFESSIONAL_SERVICES: 75000,
  RETAIL: 14000,
  OTHER: 30000,
}

function makeDate(monthsAgo: number, day: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 10, 0, 0)
}

function closeDate(createdAt: Date, daysLater: number) {
  const date = new Date(createdAt)
  date.setDate(date.getDate() + daysLater)
  return date
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

function buildStarterLeads(businessId: string, businessType: string) {
  const baseValue = averageLeadValues[businessType] ?? averageLeadValues.OTHER
  const firstWonDate = makeDate(5, 8)
  const secondWonDate = makeDate(3, 17)
  const thirdWonDate = makeDate(1, 12)

  return [
    {
      businessId,
      customerName: "Jamie Parker",
      customerPhone: "(555) 014-1824",
      source: "MISSED_CALL",
      status: "WON",
      estimatedValueCents: baseValue,
      wonValueCents: baseValue,
      createdAt: firstWonDate,
      closedAt: closeDate(firstWonDate, 2),
    },
    {
      businessId,
      customerName: "Morgan Lee",
      customerPhone: "(555) 016-4480",
      source: "WEBSITE",
      status: "CONTACTED",
      estimatedValueCents: Math.round(baseValue * 0.7),
      wonValueCents: 0,
      createdAt: makeDate(4, 14),
      closedAt: null,
    },
    {
      businessId,
      customerName: "Taylor Brooks",
      customerPhone: "(555) 019-2571",
      source: "MISSED_CALL",
      status: "WON",
      estimatedValueCents: Math.round(baseValue * 1.3),
      wonValueCents: Math.round(baseValue * 1.15),
      createdAt: secondWonDate,
      closedAt: closeDate(secondWonDate, 3),
    },
    {
      businessId,
      customerName: "Casey Nguyen",
      customerPhone: "(555) 013-9022",
      source: "REFERRAL",
      status: "LOST",
      estimatedValueCents: Math.round(baseValue * 0.5),
      wonValueCents: 0,
      createdAt: makeDate(2, 6),
      closedAt: closeDate(makeDate(2, 6), 4),
    },
    {
      businessId,
      customerName: "Riley Smith",
      customerPhone: "(555) 011-7304",
      source: "WEBSITE",
      status: "NEW",
      estimatedValueCents: Math.round(baseValue * 0.8),
      wonValueCents: 0,
      createdAt: makeDate(1, 4),
      closedAt: null,
    },
    {
      businessId,
      customerName: "Avery Johnson",
      customerPhone: "(555) 018-6161",
      source: "MISSED_CALL",
      status: "WON",
      estimatedValueCents: Math.round(baseValue * 1.1),
      wonValueCents: baseValue,
      createdAt: thirdWonDate,
      closedAt: closeDate(thirdWonDate, 1),
    },
    {
      businessId,
      customerName: "Jordan Davis",
      customerPhone: "(555) 015-3348",
      source: "MANUAL",
      status: "CONTACTED",
      estimatedValueCents: Math.round(baseValue * 0.9),
      wonValueCents: 0,
      createdAt: makeDate(0, 10),
      closedAt: null,
    },
    {
      businessId,
      customerName: "Skyler Reed",
      customerPhone: "(555) 017-4209",
      source: "WEBSITE",
      status: "NEW",
      estimatedValueCents: Math.round(baseValue * 0.6),
      wonValueCents: 0,
      createdAt: makeDate(0, 19),
      closedAt: null,
    },
  ]
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
      data: buildStarterLeads(business.id, business.businessType),
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
  const leads = business.leads.filter((lead) => {
    const sourceMatches =
      selectedSource === "ALL" || lead.source === selectedSource
    const statusMatches =
      selectedStatus === "ALL" || lead.status === selectedStatus
    const startMatches = !startDate || lead.createdAt >= startDate
    const endMatches = !endDate || lead.createdAt <= endDate

    return sourceMatches && statusMatches && startMatches && endMatches
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
            <Link
              href="/leads"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open pipeline
            </Link>
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

          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-800">
              Recovered by LeadReply
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {formatMoney(recoveredRevenueCents)}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              This counts won revenue from missed-call leads.
            </p>
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
