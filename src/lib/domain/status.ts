export const leadStatuses = {
  new: "NEW",
  current: "CURRENT",
  // Legacy value kept so older data/imports still read as an active lead.
  contacted: "CONTACTED",
  captured: "CAPTURED",
  closed: "CLOSED",
} as const

export type LeadStatus = (typeof leadStatuses)[keyof typeof leadStatuses]

export const openLeadStatuses = [
  leadStatuses.new,
  leadStatuses.current,
  leadStatuses.contacted,
] as const

export const missedCallStatuses = {
  new: "NEW",
  replied: "REPLIED",
} as const

export type MissedCallStatus =
  (typeof missedCallStatuses)[keyof typeof missedCallStatuses]

export const missedCallAssistantStatuses = {
  inProgress: "IN_PROGRESS",
  readyForOwner: "READY_FOR_OWNER",
  completed: "COMPLETED",
} as const

export type MissedCallAssistantStatus =
  (typeof missedCallAssistantStatuses)[keyof typeof missedCallAssistantStatuses]

export const missedCallAssistantReviewStatuses = {
  needsReview: "NEEDS_REVIEW",
  changesRequested: "CHANGES_REQUESTED",
  approved: "APPROVED",
} as const

export type MissedCallAssistantReviewStatus =
  (typeof missedCallAssistantReviewStatuses)[keyof typeof missedCallAssistantReviewStatuses]

export const communicationStatuses = {
  draft: "DRAFT",
  queued: "QUEUED",
  sending: "SENDING",
  sent: "SENT",
  delivered: "DELIVERED",
  received: "RECEIVED",
  failed: "FAILED",
  skipped: "SKIPPED",
} as const

export type CommunicationStatus =
  (typeof communicationStatuses)[keyof typeof communicationStatuses]

export const opsJobStatuses = {
  planned: "PLANNED",
  queued: "QUEUED",
  running: "RUNNING",
  retrying: "RETRYING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  cancelled: "CANCELLED",
} as const

export type OpsJobStatus = (typeof opsJobStatuses)[keyof typeof opsJobStatuses]

export const billingStatuses = {
  planSelected: "PLAN_SELECTED",
  trialing: "TRIALING",
  active: "ACTIVE",
  pastDue: "PAST_DUE",
  canceled: "CANCELED",
} as const

export type BillingStatus =
  (typeof billingStatuses)[keyof typeof billingStatuses]

export const appointmentStatuses = {
  notBooked: "NOT_BOOKED",
  requested: "REQUESTED",
  booked: "BOOKED",
  completed: "COMPLETED",
  noShow: "NO_SHOW",
  cancelled: "CANCELLED",
} as const

export type AppointmentStatus =
  (typeof appointmentStatuses)[keyof typeof appointmentStatuses]

export const activeRecordStatus = {
  active: "ACTIVE",
  blocked: "BLOCKED",
  disabled: "DISABLED",
} as const
