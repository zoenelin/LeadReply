export const internalWorkerRoles = [
  "OPERATIONS",
  "SEO",
  "MARKETING",
  "SUPPORT",
  "ADMIN",
] as const

export const internalWorkerStatuses = [
  "ACTIVE",
  "PAUSED",
  "OFFBOARDED",
] as const

export const internalAssignmentCategories = [
  "CLIENT_SETUP",
  "SEO",
  "MARKETING",
  "REVIEWS",
  "SUPPORT",
  "BILLING",
  "AUTOMATION",
] as const

export const internalAssignmentStatuses = [
  "TODO",
  "IN_PROGRESS",
  "WAITING_ON_CLIENT",
  "BLOCKED",
  "DONE",
] as const

export const internalPriorities = ["HIGH", "MEDIUM", "LOW"] as const

export const internalNoteCategories = [
  "GENERAL",
  "SALES",
  "SETUP",
  "SUPPORT",
  "BILLING",
  "SEO",
  "MARKETING",
] as const

export const opsJobKinds = [
  "WEBSITE_AUDIT",
  "AI_GROWTH_PLAN",
  "MISSED_CALL_TEXT_BACK",
  "MISSED_CALL_ASSISTANT_INTAKE",
  "LEAD_IMPORT",
  "OWNER_EMAIL_SUMMARY",
  "CRAWLER",
  "MANUAL",
] as const

export const opsJobStatuses = [
  "PLANNED",
  "QUEUED",
  "RUNNING",
  "RETRYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const

export const adminBillingStatuses = [
  "PLAN_SELECTED",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
] as const

export const adminContentStatuses = [
  "DRAFT",
  "NEEDS_APPROVAL",
  "SCHEDULED",
  "POSTED",
] as const

export const adminGrowthTaskCategories = [
  "PRESENCE",
  "SEO",
  "MARKETING",
  "GENERAL",
] as const

export const adminGrowthTaskStatuses = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
] as const

export const adminGrowthTaskSources = [
  "MANUAL",
  "SUGGESTED",
  "AUTOMATION",
] as const

export const adminMarketingChannels = [
  "GOOGLE_BUSINESS_PROFILE",
  "FACEBOOK",
  "INSTAGRAM",
  "EMAIL",
  "WEBSITE",
  "LOCAL_SEO",
  "OTHER",
] as const

export function labelFromValue(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")
}
