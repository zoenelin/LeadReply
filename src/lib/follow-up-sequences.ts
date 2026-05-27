export const followUpStepStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  SKIPPED: "Skipped",
}

export type FollowUpSequenceStep = {
  id: string
  title: string
  message: string
  channel: string
  status: string
  stepOrder: number
  dueAt: Date | null
  sentAt: Date | null
  leadId: string
}

type SuggestedFollowUpInput = {
  businessName: string
  businessType: string
  customerName: string
  requestContext?: string
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(9, 0, 0, 0)
  return date
}

function percentage(part: number, whole: number) {
  if (whole === 0) {
    return 0
  }

  return Math.round((part / whole) * 100)
}

function getServicePhrase(businessType: string) {
  const phrases: Record<string, string> = {
    AUTOMOTIVE: "the vehicle service you asked about",
    HOME_SERVICES: "the project you asked about",
    BEAUTY_SERVICES: "the appointment you asked about",
    FOOD_SERVICES: "the reservation or order you asked about",
    MEDICAL_WELLNESS: "the appointment you asked about",
    LEGAL: "the consultation you asked about",
    FITNESS: "the membership or class you asked about",
    REAL_ESTATE: "the property request you asked about",
    PROFESSIONAL_SERVICES: "the service you asked about",
    RETAIL: "the product or order you asked about",
    OTHER: "the request you asked about",
  }

  return phrases[businessType] ?? phrases.OTHER
}

export function getFollowUpStatusLabel(status: string) {
  return followUpStepStatusLabels[status] ?? status
}

export function followUpStepStatusClassName(status: string) {
  if (status === "SENT") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "SKIPPED") {
    return "bg-slate-100 text-slate-600"
  }

  return "bg-amber-50 text-amber-700"
}

export function getSuggestedFollowUpSteps({
  businessName,
  businessType,
  customerName,
  requestContext,
}: SuggestedFollowUpInput) {
  const servicePhrase = getServicePhrase(businessType)
  const context = requestContext?.trim()
  const contextLine = context ? ` I have this note: ${context}` : ""

  return [
    {
      title: "First follow-up",
      message: `Hi ${customerName}, this is ${businessName}. I wanted to follow up about ${servicePhrase}.${contextLine} What is the best next step for you?`,
      channel: "TEXT",
      stepOrder: 1,
      dueAt: addDays(0),
    },
    {
      title: "Second check-in",
      message: `Hi ${customerName}, just checking in from ${businessName}. Do you still need help with ${servicePhrase}?`,
      channel: "TEXT",
      stepOrder: 2,
      dueAt: addDays(1),
    },
    {
      title: "Final check-in",
      message: `Hi ${customerName}, last quick note from ${businessName}. If now is not the right time, no problem. We are here when you are ready.`,
      channel: "TEXT",
      stepOrder: 3,
      dueAt: addDays(3),
    },
  ]
}

export function getFollowUpSequenceStats(steps: FollowUpSequenceStep[]) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const draftSteps = steps.filter((step) => step.status === "DRAFT")
  const sentSteps = steps.filter((step) => step.status === "SENT")
  const skippedSteps = steps.filter((step) => step.status === "SKIPPED")
  const dueTodaySteps = draftSteps.filter(
    (step) => step.dueAt && step.dueAt <= todayEnd
  )
  const overdueSteps = draftSteps.filter(
    (step) => step.dueAt && step.dueAt < todayStart
  )
  const activeLeadIds = new Set(draftSteps.map((step) => step.leadId))

  return {
    totalCount: steps.length,
    draftCount: draftSteps.length,
    sentCount: sentSteps.length,
    skippedCount: skippedSteps.length,
    dueTodayCount: dueTodaySteps.length,
    overdueCount: overdueSteps.length,
    activeSequenceCount: activeLeadIds.size,
    completionRate: percentage(sentSteps.length + skippedSteps.length, steps.length),
  }
}

export function getFollowUpSequenceMessage(
  stats: ReturnType<typeof getFollowUpSequenceStats>
) {
  if (stats.totalCount === 0) {
    return "Create a sequence on a lead to keep every follow-up organized."
  }

  if (stats.overdueCount > 0) {
    return `${stats.overdueCount} sequence step${
      stats.overdueCount === 1 ? "" : "s"
    } are overdue. Start there first.`
  }

  if (stats.dueTodayCount > 0) {
    return `${stats.dueTodayCount} sequence step${
      stats.dueTodayCount === 1 ? "" : "s"
    } are ready to send today.`
  }

  return "Follow-up sequences are caught up for today."
}
