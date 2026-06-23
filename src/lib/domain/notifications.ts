import {
  communicationStatuses,
  missedCallAssistantStatuses,
  leadStatuses,
  missedCallStatuses,
  openLeadStatuses,
} from "@/lib/domain/status"

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

type MissedCallAssistantNotificationInput = {
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
  missedCallAssistantIntakes: MissedCallAssistantNotificationInput[]
  reviewRequests: ReviewRequestNotificationInput[]
  followUpSteps: FollowUpStepNotificationInput[]
  now?: Date
}

const priorityScore: Record<NotificationPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const openLeadStatusSet = new Set<string>(openLeadStatuses)

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
  missedCallAssistantIntakes,
  reviewRequests,
  followUpSteps,
  now = new Date(),
}: BuildNotificationsInput) {
  const notifications: NotificationItem[] = []

  for (const lead of leads) {
    if (lead.status === leadStatuses.new) {
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
      openLeadStatusSet.has(lead.status)
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
      lead.status === leadStatuses.captured &&
      (lead.reviewRequests ?? []).every(
        (request) =>
          request.status !== communicationStatuses.sent &&
          request.status !== communicationStatuses.received
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
    if (call.status === missedCallStatuses.new) {
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

  for (const intake of missedCallAssistantIntakes) {
    if (intake.status === missedCallAssistantStatuses.readyForOwner) {
      const customer =
        intake.missedCall?.callerName ?? intake.summary.split(".")[0] ?? "A lead"

      notifications.push({
        id: `missedCallAssistant-${intake.id}`,
        title: "Missed-call assistant ready",
        message: `${customer} has an intake summary ready for review.`,
        href: leadHref(intake.lead?.id ?? intake.leadId),
        category: "LeadReply missed-call assistant",
        priority: "HIGH",
        createdAt: intake.updatedAt,
      })
    }
  }

  for (const request of reviewRequests) {
    if (request.status === communicationStatuses.draft) {
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
    if (
      step.status === communicationStatuses.draft &&
      isPastDue(step.dueAt, now)
    ) {
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
