type NotificationPriority = "HIGH" | "MEDIUM" | "LOW"

export type NotificationItem = {
  id: string
  title: string
  message: string
  href: string
  category: string
  priority: NotificationPriority
  createdAt: Date | string
}

type LeadNotificationInput = {
  id: string
  customerName: string
  customerPhone: string
  status: string
  followUpAt: Date | string | null
  followUpCompletedAt: Date | string | null
  createdAt: Date | string
  reviewRequests?: {
    id: string
    status: string
  }[]
}

type MissedCallNotificationInput = {
  id: string
  callerName: string
  callerPhone: string
  status: string
  createdAt: Date | string
}

type ConciergeNotificationInput = {
  id: string
  status: string
  summary: string
  updatedAt: Date | string
  leadId: string | null
  missedCall?: {
    callerName: string
    callerPhone: string
  }
  lead?: {
    id: string
  } | null
}

type ReviewRequestNotificationInput = {
  id: string
  customerName: string
  status: string
  createdAt: Date | string
  leadId: string | null
}

type FollowUpStepNotificationInput = {
  id: string
  title: string
  status: string
  dueAt: Date | string | null
  createdAt: Date | string
  lead: {
    id: string
    customerName: string
  }
}

type BuildNotificationsInput = {
  leads: LeadNotificationInput[]
  missedCalls: MissedCallNotificationInput[]
  conciergeIntakes: ConciergeNotificationInput[]
  reviewRequests: ReviewRequestNotificationInput[]
  followUpSteps: FollowUpStepNotificationInput[]
  now?: Date
}

const priorityScore: Record<NotificationPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

function isPastDue(value: Date | string | null, now: Date) {
  if (!value) {
    return false
  }

  return new Date(value).getTime() <= now.getTime()
}

function leadHref(leadId: string | null | undefined) {
  return leadId ? `/leads/${leadId}` : "/leads"
}

export function buildNotifications({
  leads,
  missedCalls,
  conciergeIntakes,
  reviewRequests,
  followUpSteps,
  now = new Date(),
}: BuildNotificationsInput) {
  const notifications: NotificationItem[] = []

  for (const lead of leads) {
    if (lead.status === "NEW") {
      notifications.push({
        id: `new-lead-${lead.id}`,
        title: "New lead captured",
        message: `${lead.customerName} is waiting for a first response.`,
        href: `/leads/${lead.id}`,
        category: "Leads",
        priority: "HIGH",
        createdAt: lead.createdAt,
      })
    }

    if (
      isPastDue(lead.followUpAt, now) &&
      !lead.followUpCompletedAt &&
      (lead.status === "NEW" || lead.status === "CONTACTED")
    ) {
      notifications.push({
        id: `lead-follow-up-${lead.id}`,
        title: "Follow-up is due",
        message: `${lead.customerName} has a follow-up ready now.`,
        href: `/leads/${lead.id}`,
        category: "Follow-up",
        priority: "HIGH",
        createdAt: lead.followUpAt ?? lead.createdAt,
      })
    }

    if (
      lead.status === "WON" &&
      (lead.reviewRequests ?? []).every(
        (request) => request.status !== "SENT" && request.status !== "RECEIVED"
      )
    ) {
      notifications.push({
        id: `review-needed-${lead.id}`,
        title: "Review prompt ready",
        message: `${lead.customerName} is a captured lead with no sent review request.`,
        href: `/leads/${lead.id}`,
        category: "Reviews",
        priority: "MEDIUM",
        createdAt: lead.createdAt,
      })
    }
  }

  for (const call of missedCalls) {
    if (call.status === "NEW") {
      notifications.push({
        id: `missed-call-${call.id}`,
        title: "New missed call",
        message: `${call.callerName} called from ${call.callerPhone}.`,
        href: "/missed-calls",
        category: "Inbox",
        priority: "HIGH",
        createdAt: call.createdAt,
      })
    }
  }

  for (const intake of conciergeIntakes) {
    if (intake.status === "READY_FOR_OWNER") {
      const customer =
        intake.missedCall?.callerName ?? intake.summary.split(".")[0] ?? "A lead"

      notifications.push({
        id: `concierge-${intake.id}`,
        title: "AI intake ready",
        message: `${customer} has an intake summary ready for review.`,
        href: leadHref(intake.lead?.id ?? intake.leadId),
        category: "AI concierge",
        priority: "HIGH",
        createdAt: intake.updatedAt,
      })
    }
  }

  for (const request of reviewRequests) {
    if (request.status === "DRAFT") {
      notifications.push({
        id: `review-draft-${request.id}`,
        title: "Draft review request",
        message: `${request.customerName} has a review request drafted but not sent.`,
        href: leadHref(request.leadId),
        category: "Reviews",
        priority: "MEDIUM",
        createdAt: request.createdAt,
      })
    }
  }

  for (const step of followUpSteps) {
    if (step.status === "DRAFT" && isPastDue(step.dueAt, now)) {
      notifications.push({
        id: `sequence-step-${step.id}`,
        title: "Sequence step due",
        message: `${step.title} for ${step.lead.customerName} is ready.`,
        href: `/leads/${step.lead.id}`,
        category: "Sequences",
        priority: "MEDIUM",
        createdAt: step.dueAt ?? step.createdAt,
      })
    }
  }

  return notifications.sort(
    (left, right) =>
      priorityScore[right.priority] - priorityScore[left.priority] ||
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}
