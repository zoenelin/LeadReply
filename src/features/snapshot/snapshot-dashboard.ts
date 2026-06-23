import { leadStatuses } from "@/lib/domain/status"
import { isHomeServiceBusinessType } from "@/lib/domain/home-services"
import {
  formatMoney,
  leadStatusLabels,
  normalizeLeadStatus,
} from "@/services/modules/core"
import { getReviewFunnelMessage } from "@/services/modules/reviews"

type SnapshotBusinessContent = {
  headline: string
  description: string
}

const businessTypeContent: Record<string, SnapshotBusinessContent> = {
  AUTOMOTIVE: {
    headline: "Turn missed service calls into booked appointments.",
    description:
      "Use LeadReply to follow up when drivers ask about repairs, inspections, estimates, or availability.",
  },
  HOME_SERVICES: {
    headline: "Recover calls from homeowners who need help fast.",
    description:
      "Use LeadReply to follow up when someone calls about repairs, estimates, emergency work, or scheduling.",
  },
  BEAUTY_SERVICES: {
    headline: "Turn missed appointment calls into booked clients.",
    description:
      "Use LeadReply to reply when someone asks about openings, services, pricing, or last-minute availability.",
  },
  FOOD_SERVICES: {
    headline: "Keep food orders, reservations, and questions moving.",
    description:
      "Use LeadReply to respond when guests call about hours, reservations, catering, pickup, or large orders.",
  },
  MEDICAL_WELLNESS: {
    headline: "Help patients and clients get a quick response.",
    description:
      "Use LeadReply to follow up when someone asks about appointments, services, insurance, or availability.",
  },
  LEGAL: {
    headline: "Capture consultation requests before they go cold.",
    description:
      "Use LeadReply to respond when someone calls about consultations, case fit, fees, or availability.",
  },
  FITNESS: {
    headline: "Convert class and membership questions into signups.",
    description:
      "Use LeadReply to follow up when people ask about memberships, classes, trials, or personal training.",
  },
  REAL_ESTATE: {
    headline: "Reply quickly to buyers, sellers, and rental leads.",
    description:
      "Use LeadReply to follow up when someone asks about listings, showings, valuations, or availability.",
  },
  PROFESSIONAL_SERVICES: {
    headline: "Turn missed calls into scheduled consultations.",
    description:
      "Use LeadReply to follow up when prospects ask about services, pricing, consultations, or timelines.",
  },
  RETAIL: {
    headline: "Keep product questions and store calls moving.",
    description:
      "Use LeadReply to respond when shoppers ask about inventory, hours, pickups, or special orders.",
  },
  OTHER: {
    headline: "Capture missed calls and guide customers to the next step.",
    description:
      "Use LeadReply to follow up with callers, answer common questions, and request reviews after good experiences.",
  },
}

type SnapshotLead = {
  status: string
  estimatedValueCents: number
  capturedValueCents: number
  createdAt: Date
}

type SnapshotSourceRow = {
  leadCount: number
  campaignCostCents: number
}

type SnapshotGrowthStats = {
  marketingReadyCount: number
  marketingTotalCount: number
  seoReadyCount: number
  seoTotalCount: number
} | null

type SnapshotReviewFunnelStats = Parameters<typeof getReviewFunnelMessage>[0]

type SnapshotMissedCallAssistantStats = {
  readyCount: number
  inProgressCount: number
  schedulingRequestedCount: number
  quoteRequestedCount: number
}

type AnalyticsSummaryTone = "slate" | "emerald" | "sky" | "amber"

type SnapshotAnalyticsCard = {
  label: string
  value: string | number
  detail: string
  tone?: AnalyticsSummaryTone
}

export type SnapshotModuleCard = {
  label: string
  href: string
  metric: string
  description: string
}

export type SnapshotLoopItem = {
  label: string
  value: string | number
  detail: string
  href: string
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

function formatPersonName(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getSnapshotBusinessContent(
  businessType?: string | null
): SnapshotBusinessContent {
  if (businessType && isHomeServiceBusinessType(businessType)) {
    return businessTypeContent.HOME_SERVICES
  }

  return businessTypeContent[businessType ?? ""] ?? businessTypeContent.OTHER
}

export function getSnapshotWelcomeName({
  contactName,
  sessionName,
  email,
}: {
  contactName?: string | null
  sessionName?: string | null
  email?: string | null
}) {
  const namedValue = contactName?.trim() || sessionName?.trim()

  if (namedValue) {
    return formatPersonName(namedValue)
  }

  const emailName = email?.split("@")[0] ?? ""
  const formattedEmailName = formatPersonName(emailName)

  return formattedEmailName || "there"
}

export function getSnapshotAnalytics<SourceRow extends SnapshotSourceRow>({
  leads,
  sourceRows,
  capturedRevenueCents,
}: {
  leads: SnapshotLead[]
  sourceRows: SourceRow[]
  capturedRevenueCents: number
}) {
  const capturedLeads = leads.filter(
    (lead) =>
      lead.status === leadStatuses.captured ||
      (lead.status === leadStatuses.closed && lead.capturedValueCents > 0)
  )
  const closedLeads = leads.filter((lead) => lead.status === leadStatuses.closed)
  const openLeads = leads.filter(
    (lead) =>
      lead.status !== leadStatuses.captured &&
      lead.status !== leadStatuses.closed
  )
  const openLeadValueCents = openLeads.reduce(
    (total, lead) => total + lead.estimatedValueCents,
    0
  )
  const closedLeadValueCents = closedLeads.reduce(
    (total, lead) =>
      total + (lead.capturedValueCents || lead.estimatedValueCents),
    0
  )
  const campaignCostCents = sourceRows.reduce(
    (total, source) => total + source.campaignCostCents,
    0
  )
  const marketingRoiCents = capturedRevenueCents - campaignCostCents
  const conversionRate =
    leads.length === 0
      ? 0
      : Math.round((capturedLeads.length / leads.length) * 100)
  const monthRows = getLastSixMonths().map((month) => {
    const monthLeads = leads.filter((lead) => monthKey(lead.createdAt) === month.key)
    const monthRevenueCents = monthLeads.reduce(
      (total, lead) => total + lead.capturedValueCents,
      0
    )

    return {
      ...month,
      leads: monthLeads.length,
      revenueCents: monthRevenueCents,
    }
  })
  const statusRows = [
    leadStatuses.new,
    leadStatuses.current,
    leadStatuses.captured,
    leadStatuses.closed,
  ].map((status) => ({
    status,
    label: leadStatusLabels[status],
    count: leads.filter((lead) => normalizeLeadStatus(lead.status) === status)
      .length,
  }))
  const cards: SnapshotAnalyticsCard[] = [
    {
      label: "Money made",
      value: formatMoney(capturedRevenueCents),
      detail: `${formatMoney(marketingRoiCents)} after campaign costs`,
      tone: "sky",
    },
    {
      label: "Leads captured",
      value: capturedLeads.length,
      detail: `${conversionRate}% of all leads converted`,
      tone: "emerald",
    },
    {
      label: "Open lead value",
      value: formatMoney(openLeadValueCents),
      detail: "Potential value still waiting for follow-up",
    },
    {
      label: "Closed work",
      value: formatMoney(closedLeadValueCents),
      detail: "Finished work with no active follow-up waiting",
      tone: "amber",
    },
  ]

  return {
    activeSourceRows: sourceRows.filter((source) => source.leadCount > 0),
    cards,
    monthRows,
    statusRows,
  }
}

export function getSnapshotModuleCards({
  leadCount,
  reviewRequestsCount,
  selectedPlan,
  growthStats,
}: {
  leadCount: number
  reviewRequestsCount: number
  selectedPlan: string
  growthStats: SnapshotGrowthStats
}): SnapshotModuleCard[] {
  return [
    {
      label: "Customers/Jobs",
      href: "/leads",
      metric: `${leadCount} leads`,
      description: "Lead capture, missed-call text back, missed-call assistant intake, and follow-up.",
    },
    {
      label: "Reviews",
      href: "/reviews",
      metric: `${reviewRequestsCount} requests`,
      description: "Review requests and captured-customer review tracking.",
    },
    {
      label: "Growth",
      href: "/growth",
      metric:
        selectedPlan === "GROWTH" || selectedPlan === "COMPLETE"
          ? `${
              (growthStats?.seoReadyCount ?? 0) +
              (growthStats?.marketingReadyCount ?? 0)
            }/${
              (growthStats?.seoTotalCount ?? 0) +
              (growthStats?.marketingTotalCount ?? 0)
            } ready`
          : "Not enabled",
      description: "SEO requests, marketing requests, approvals, and status.",
    },
  ]
}

export function getSnapshotLoopItems({
  missedCallAssistantStats,
  reviewFunnelStats,
}: {
  missedCallAssistantStats: SnapshotMissedCallAssistantStats
  reviewFunnelStats: SnapshotReviewFunnelStats
}): SnapshotLoopItem[] {
  const reviewProgressLabel =
    reviewFunnelStats.capturedLeadCount === 0
      ? "No captured customers yet"
      : `${reviewFunnelStats.requestedCapturedLeadCount}/${reviewFunnelStats.capturedLeadCount} requested`

  return [
    {
      label: "Missed-call assistant",
      value:
        missedCallAssistantStats.readyCount > 0
          ? `${missedCallAssistantStats.readyCount} ready`
          : `${missedCallAssistantStats.inProgressCount} active`,
      detail: `${missedCallAssistantStats.schedulingRequestedCount} scheduling, ${missedCallAssistantStats.quoteRequestedCount} quote`,
      href: "/missed-calls",
    },
    {
      label: "Reviews",
      value: reviewProgressLabel,
      detail: getReviewFunnelMessage(reviewFunnelStats),
      href: "/reviews",
    },
  ]
}
