import { minutesBetween } from "@/lib/analytics/response-speed"
import { missedCallStatuses, openLeadStatuses } from "@/lib/domain/status"

type AtRiskLead = {
  id: string
  customerName: string
  customerPhone: string
  status: string
  estimatedValueCents: number
  followUpAt: Date | null
  followUpCompletedAt: Date | null
}

type AtRiskMissedCall = {
  id: string
  callerName: string
  callerPhone: string
  reason: string
  status: string
  repliedAt: Date | null
  createdAt: Date
}

type AtRiskWorkInput = {
  leads: AtRiskLead[]
  missedCalls: AtRiskMissedCall[]
  missedCallValueCents: number
  staleMissedCallMinutes?: number
}

export type AtRiskWorkItem = {
  id: string
  label: string
  name: string
  description: string
  valueCents: number
  href: string
  ageMinutes: number | null
}

const openLeadStatusSet = new Set<string>(openLeadStatuses)

function sumValue(items: { valueCents: number }[]) {
  return items.reduce((total, item) => total + item.valueCents, 0)
}

function sortByValue(left: AtRiskWorkItem, right: AtRiskWorkItem) {
  return (
    right.valueCents - left.valueCents ||
    (right.ageMinutes ?? 0) - (left.ageMinutes ?? 0)
  )
}

export function getAtRiskWorkStats({
  leads,
  missedCalls,
  missedCallValueCents,
  staleMissedCallMinutes = 60,
}: AtRiskWorkInput) {
  const now = new Date()
  const overdueLeadItems = leads
    .filter(
      (lead) =>
        openLeadStatusSet.has(lead.status) &&
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
        call.status !== missedCallStatuses.replied &&
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
  const overdueLeadValueCents = sumValue(overdueLeadItems)
  const staleMissedCallValueCents = sumValue(staleMissedCallItems)
  const totalAtRiskCents = overdueLeadValueCents + staleMissedCallValueCents

  return {
    overdueLeadCount: overdueLeadItems.length,
    staleMissedCallCount: staleMissedCallItems.length,
    actionItemCount: actionItems.length,
    overdueLeadValueCents,
    staleMissedCallValueCents,
    totalAtRiskCents,
    actionItems,
    topActionItem: actionItems[0] ?? null,
  }
}

export function getAtRiskWorkLabel(stats: ReturnType<typeof getAtRiskWorkStats>) {
  return stats.totalAtRiskCents > 0 ? "Needs follow-up" : "Caught up"
}

export function getAtRiskWorkMessage(
  stats: ReturnType<typeof getAtRiskWorkStats>
) {
  if (stats.totalAtRiskCents > 0) {
    return `${stats.actionItemCount} open item${
      stats.actionItemCount === 1 ? "" : "s"
    } needs attention.`
  }

  return "No overdue follow-ups or stale missed calls are showing right now."
}
