import { opsJobStatuses } from "@/lib/domain/status"

export const automationQueueName = "leadreply-automation"

export const queueJobTypes = [
  "MISSED_CALL_TEXT_BACK",
  "MISSED_CALL_ASSISTANT_INTAKE",
  "GOOGLE_REVIEW_SYNC",
  "AI_GROWTH_PLAN",
  "WEBSITE_AUDIT",
  "LEAD_IMPORT",
  "OWNER_EMAIL_SUMMARY",
] as const

export type QueueJobType = (typeof queueJobTypes)[number]

export type LeadReplyJobData = {
  opsJobRunId: string
  type: QueueJobType
  businessId?: string | null
  payload: Record<string, unknown>
  dedupeKey?: string
}

export const activeQueueStatuses = [
  opsJobStatuses.queued,
  opsJobStatuses.running,
  opsJobStatuses.retrying,
  opsJobStatuses.succeeded,
] as const

export const retryableQueueStatuses = [
  opsJobStatuses.failed,
  opsJobStatuses.cancelled,
] as const

export function isQueueJobType(value: string): value is QueueJobType {
  return queueJobTypes.includes(value as QueueJobType)
}
