import { leadSourceLabels } from "@/lib/lead-options"
import { minutesBetween } from "@/lib/response-speed"

type LostRevenueLead = {
  id: string
  customerName: string
  customerPhone: string
  source: string
  status: string
  estimatedValueCents: number
  followUpAt: Date | null
  followUpCompletedAt: Date | null
  createdAt: Date
}

type LostRevenueMissedCall = {
  id: string
  callerName: string
  callerPhone: string
  reason: string
  status: string
  repliedAt: Date | null
  createdAt: Date
}

type LostRevenueInput = {
  leads: LostRevenueLead[]
  missedCalls: LostRevenueMissedCall[]
  missedCallValueCents: number
  staleMissedCallMinutes?: number
}

export type LostRevenueItem = {
  id: string
  label: string
  name: string
  description: string
  valueCents: number
  href: string
  ageMinutes: number | null
}

const openLeadStatuses = new Set(["NEW", "CONTACTED"])

function sumValue(items: { valueCents: number }[]) {
  return items.reduce((total, item) => total + item.valueCents, 0)
}

function sortByValue(left: LostRevenueItem, right: LostRevenueItem) {
  return (
    right.valueCents - left.valueCents ||
    (right.ageMinutes ?? 0) - (left.ageMinutes ?? 0)
  )
}

export function getLostRevenueStats({
  leads,
  missedCalls,
  missedCallValueCents,
  staleMissedCallMinutes = 60,
}: LostRevenueInput) {
  const now = new Date()
  const lostLeadItems = leads
    .filter((lead) => lead.status === "LOST")
    .map((lead) => ({
      id: lead.id,
      label: "Closed lost",
      name: lead.customerName,
      description: `${
        leadSourceLabels[lead.source] ?? "Lead"
      } marked lost.`,
      valueCents: lead.estimatedValueCents,
      href: `/leads/${lead.id}`,
      ageMinutes: minutesBetween(lead.createdAt, now),
    }))
  const overdueLeadItems = leads
    .filter(
      (lead) =>
        openLeadStatuses.has(lead.status) &&
        lead.followUpAt &&
        lead.followUpAt < now &&
        !lead.followUpCompletedAt
    )
    .map((lead) => ({
      id: lead.id,
      label: "Overdue follow-up",
      name: lead.customerName,
      description: `${lead.customerPhone} needs a follow-up.`,
      valueCents: lead.estimatedValueCents,
      href: `/leads/${lead.id}`,
      ageMinutes: lead.followUpAt ? minutesBetween(lead.followUpAt, now) : null,
    }))
  const staleMissedCallItems = missedCalls
    .filter(
      (call) =>
        call.status !== "REPLIED" &&
        !call.repliedAt &&
        minutesBetween(call.createdAt, now) >= staleMissedCallMinutes
    )
    .map((call) => ({
      id: call.id,
      label: "Unanswered missed call",
      name: call.callerName,
      description: call.reason || `${call.callerPhone} is waiting for a reply.`,
      valueCents: missedCallValueCents,
      href: "/missed-calls",
      ageMinutes: minutesBetween(call.createdAt, now),
    }))
  const actionItems = [...overdueLeadItems, ...staleMissedCallItems].sort(
    sortByValue
  )
  const lostItems = [...lostLeadItems].sort(sortByValue)
  const lostLeadValueCents = sumValue(lostLeadItems)
  const overdueLeadValueCents = sumValue(overdueLeadItems)
  const staleMissedCallValueCents = sumValue(staleMissedCallItems)
  const totalAtRiskCents = overdueLeadValueCents + staleMissedCallValueCents
  const totalLostAndAtRiskCents = lostLeadValueCents + totalAtRiskCents

  return {
    lostLeadCount: lostLeadItems.length,
    overdueLeadCount: overdueLeadItems.length,
    staleMissedCallCount: staleMissedCallItems.length,
    actionItemCount: actionItems.length,
    lostLeadValueCents,
    overdueLeadValueCents,
    staleMissedCallValueCents,
    totalAtRiskCents,
    totalLostAndAtRiskCents,
    actionItems,
    lostItems,
    topActionItem: actionItems[0] ?? null,
  }
}

export function getLostRevenueLabel(
  stats: ReturnType<typeof getLostRevenueStats>
) {
  if (stats.totalAtRiskCents > 0) {
    return "Needs follow-up"
  }

  if (stats.lostLeadValueCents > 0) {
    return "Watch lost leads"
  }

  return "No leak found"
}

export function getLostRevenueMessage(
  stats: ReturnType<typeof getLostRevenueStats>
) {
  if (stats.totalAtRiskCents > 0) {
    return `${stats.actionItemCount} open item${
      stats.actionItemCount === 1 ? "" : "s"
    } could still be recovered.`
  }

  if (stats.lostLeadValueCents > 0) {
    return `${stats.lostLeadCount} lost lead${
      stats.lostLeadCount === 1 ? "" : "s"
    } should be reviewed for patterns.`
  }

  return "No overdue follow-ups, stale missed calls, or closed-lost value showing right now."
}
