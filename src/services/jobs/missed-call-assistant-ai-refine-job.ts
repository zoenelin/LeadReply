import { Prisma } from "@prisma/client"
import {
  buildMissedCallAssistantLeadNotes,
  buildMissedCallAssistantSummary,
  normalizeMissedCallAssistantAnswers,
} from "@/lib/domain/missed-call-assistant"
import { prisma } from "@/lib/data/prisma"
import { formatApprovedBusinessMemoryForPrompt } from "@/services/business-memory/memory"
import { refineMissedCallAssistantSummary } from "@/services/ai/openai-missed-call-assistant"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"
import { recordAiUsage } from "@/services/observability/ai-usage"

function mergeLeadNotes(existingNotes: string, refinedNotes: string) {
  if (!existingNotes.trim()) {
    return refinedNotes
  }

  if (existingNotes.startsWith("LeadReply missed-call assistant summary:")) {
    return refinedNotes
  }

  return `${existingNotes.trim()}\n\n${refinedNotes}`.trim()
}

export async function runMissedCallAssistantAiRefineJob({
  intakeId,
}: {
  intakeId: string
}) {
  const intake = await prisma.missedCallAssistantIntake.findUnique({
    where: {
      id: intakeId,
    },
    include: {
      missedCall: true,
      lead: true,
      business: {
        include: {
          serviceOfferings: {
            orderBy: {
              displayOrder: "asc",
            },
          },
          availabilityWindows: {
            orderBy: [
              {
                dayOfWeek: "asc",
              },
              {
                startTime: "asc",
              },
            ],
          },
          businessMemoryItems: {
            where: {
              status: "APPROVED",
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 24,
          },
        },
      },
    },
  })

  if (!intake) {
    throw new Error("Missed-call assistant intake not found for AI refinement.")
  }

  const answers = normalizeMissedCallAssistantAnswers(intake.answers)
  const approvedMemory = formatApprovedBusinessMemoryForPrompt(
    intake.business.businessMemoryItems
  )
  const baseSummary = buildMissedCallAssistantSummary({
    answers,
    businessType: intake.business.businessType,
    bookingAutomationEnabled: intake.business.bookingAutomationEnabled,
    autoSchedulingEnabled: intake.business.autoSchedulingEnabled,
    quoteEstimateEnabled: intake.business.quoteEstimateEnabled,
    quoteRules: intake.business.quoteRules,
    quoteDisclaimer: intake.business.quoteDisclaimer,
    callbackTimeframe: intake.business.callbackTimeframe,
    services: intake.business.serviceOfferings,
    availabilityWindows: intake.business.availabilityWindows,
  })
  const refinedSummary = await refineMissedCallAssistantSummary({
    baseSummary,
    businessName: intake.business.name,
    businessType: intake.business.businessType,
    businessCity: intake.business.city,
    businessState: intake.business.state,
    businessWebsite: intake.business.website,
    businessPhone: intake.business.phone,
    bookingAutomationEnabled: intake.business.bookingAutomationEnabled,
    autoSchedulingEnabled: intake.business.autoSchedulingEnabled,
    quoteEstimateEnabled: intake.business.quoteEstimateEnabled,
    quoteRules: intake.business.quoteRules,
    quoteDisclaimer: intake.business.quoteDisclaimer,
    callbackTimeframe: intake.business.callbackTimeframe,
    approvedMemory,
    services: intake.business.serviceOfferings,
    availabilityWindows: intake.business.availabilityWindows,
    answers,
  })
  const summary = refinedSummary.summary
  const leadNotes = buildMissedCallAssistantLeadNotes({
    summary: summary.summary,
    nextAction: summary.nextAction,
    schedulingMode: summary.schedulingMode,
    quoteGuidance: summary.quoteGuidance,
    matchedServiceName: summary.matchedServiceName,
    serviceEstimate: summary.matchedServiceEstimate,
    serviceDuration: summary.matchedServiceDuration,
    availabilityGuidance: summary.availabilityGuidance,
    answers,
  })

  await prisma.$transaction(async (tx) => {
    await tx.missedCallAssistantIntake.update({
      where: {
        id: intake.id,
      },
      data: {
        intent: summary.intent,
        urgency: summary.urgency,
        preferredTime: summary.preferredTime,
        schedulingRequested: summary.schedulingRequested,
        schedulingMode: summary.schedulingMode,
        quoteRequested: summary.quoteRequested,
        quoteGuidance: summary.quoteGuidance,
        matchedServiceId: summary.matchedServiceId,
        matchedServiceName: summary.matchedServiceName,
        matchedQuoteLowCents: summary.matchedQuoteLowCents,
        matchedQuoteHighCents: summary.matchedQuoteHighCents,
        matchedDurationMinutes: summary.matchedDurationMinutes,
        serviceBookableOnline: summary.serviceBookableOnline,
        availabilityGuidance: summary.availabilityGuidance,
        summary: summary.summary,
        nextAction: summary.nextAction,
        aiProvider: refinedSummary.aiProvider,
        aiModel: refinedSummary.aiModel,
        aiError: refinedSummary.aiError,
        answers: JSON.parse(JSON.stringify(answers)) as Prisma.InputJsonValue,
      },
    })

    if (intake.lead) {
      const updatedLead = await tx.lead.update({
        where: {
          id: intake.lead.id,
        },
        data: {
          notes: mergeLeadNotes(intake.lead.notes, leadNotes),
          followUpNote: summary.nextAction,
          serviceOfferingId: summary.matchedServiceId ?? intake.lead.serviceOfferingId,
        },
      })

      await syncCustomerJobFromLead(tx, updatedLead, {
        createActivity: true,
        activityType: "AI_INTAKE_REFINED",
        activityTitle: "missed-call assistant intake refined",
        activityBody: `${summary.summary}\n\nNext action: ${summary.nextAction}`,
        activitySource: "MISSED_CALL_ASSISTANT",
        authorName: "LeadReply AI",
      })
    }
  })

  await recordAiUsage({
    businessId: intake.businessId,
    feature: "MISSED_CALL_ASSISTANT_SUMMARY",
    provider: refinedSummary.aiProvider,
    model: refinedSummary.aiModel,
    inputTokens: refinedSummary.inputTokens,
    outputTokens: refinedSummary.outputTokens,
    status:
      refinedSummary.aiProvider === "RULES"
        ? "SKIPPED"
        : refinedSummary.aiError
          ? "ERROR"
          : "SUCCESS",
    error: refinedSummary.aiError,
  })

  return {
    intakeId: intake.id,
    leadId: intake.leadId,
    aiProvider: refinedSummary.aiProvider,
    aiModel: refinedSummary.aiModel,
  }
}
