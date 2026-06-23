import type { LeadReplyJobData } from "@/services/queue/types"
import { runGoogleReviewSyncJob } from "@/services/jobs/google-review-sync-job"
import { runMissedCallAssistantAiRefineJob } from "@/services/jobs/missed-call-assistant-ai-refine-job"
import { runGrowthPlanJob } from "@/services/jobs/growth-plan-job"
import { runLeadImportJob } from "@/services/jobs/lead-import-job"
import { runMissedCallTextBackJob } from "@/services/jobs/missed-call-text-back-job"
import { runOwnerEmailSummaryJob } from "@/services/jobs/owner-email-summary-job"
import { runWebsiteAuditJob } from "@/services/jobs/website-audit-job"

function getString(payload: Record<string, unknown>, key: string) {
  const value = payload[key]

  return typeof value === "string" ? value : ""
}

export async function runAutomationJob(data: LeadReplyJobData) {
  const businessId = data.businessId || getString(data.payload, "businessId")

  switch (data.type) {
    case "WEBSITE_AUDIT":
      if (!businessId) {
        throw new Error("Website audit jobs require a businessId.")
      }

      return runWebsiteAuditJob({ businessId })

    case "AI_GROWTH_PLAN":
      if (!businessId) {
        throw new Error("Growth plan jobs require a businessId.")
      }

      return runGrowthPlanJob({ businessId })

    case "LEAD_IMPORT": {
      const csv = getString(data.payload, "csv")

      if (!businessId || !csv) {
        throw new Error("Lead import jobs require a businessId and CSV payload.")
      }

      return runLeadImportJob({ businessId, csv })
    }

    case "MISSED_CALL_TEXT_BACK": {
      const missedCallId = getString(data.payload, "missedCallId")

      if (!missedCallId) {
        throw new Error("Missed-call text jobs require a missedCallId.")
      }

      return runMissedCallTextBackJob({
        missedCallId,
        payload: data.payload,
        opsJobRunId: data.opsJobRunId,
      })
    }

    case "MISSED_CALL_ASSISTANT_INTAKE": {
      const intakeId = getString(data.payload, "intakeId")

      if (!intakeId) {
        throw new Error("Missed-call assistant AI jobs require an intakeId.")
      }

      return runMissedCallAssistantAiRefineJob({ intakeId })
    }

    case "GOOGLE_REVIEW_SYNC":
      if (!businessId) {
        throw new Error("Google review sync jobs require a businessId.")
      }

      return runGoogleReviewSyncJob({ businessId })

    case "OWNER_EMAIL_SUMMARY":
      if (!businessId) {
        throw new Error("Owner email summary jobs require a businessId.")
      }

      return runOwnerEmailSummaryJob({ businessId })
  }
}
