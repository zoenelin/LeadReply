import { Prisma } from "@prisma/client"
import {
  buildMissedCallAssistantLeadNotes,
  buildMissedCallAssistantSummary,
  createAssistantEntry,
  createCustomerEntry,
  getMissedCallAssistantCustomerConfirmation,
  getMissedCallAssistantPlan,
  normalizeMissedCallAssistantAnswers,
  normalizeMissedCallAssistantTranscript,
} from "@/lib/domain/missed-call-assistant"
import { getAverageLeadValueCents } from "@/lib/data/demo-data"
import { prisma } from "@/lib/data/prisma"
import {
  missedCallAssistantStatuses,
  leadStatuses,
  missedCallStatuses,
} from "@/lib/domain/status"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"
import { captureException } from "@/services/observability/error-monitoring"
import { enqueueOpsJob } from "@/services/queue/jobs"

export const missedCallAssistantFlowMissedCallInclude = {
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
    },
  },
  convertedLead: true,
  missedCallAssistantIntake: true,
} satisfies Prisma.MissedCallInclude

export type MissedCallAssistantFlowMissedCall = Prisma.MissedCallGetPayload<{
  include: typeof missedCallAssistantFlowMissedCallInclude
}>

type StartMissedCallAssistantInput = {
  missedCall: MissedCallAssistantFlowMissedCall
  requestId?: string
}

type ApplyMissedCallAssistantAnswerInput = {
  missedCall: MissedCallAssistantFlowMissedCall
  answer: string
  requestId?: string
}

export async function startMissedCallAssistantIntake({
  missedCall,
  requestId = "",
}: StartMissedCallAssistantInput) {
  if (missedCall.missedCallAssistantIntake) {
    return {
      intake: missedCall.missedCallAssistantIntake,
      missedCall,
      alreadyStarted: true,
      textJob: null,
    }
  }

  const plan = getMissedCallAssistantPlan({
    businessName: missedCall.business.name,
    businessType: missedCall.business.businessType,
    callerName: missedCall.callerName,
    bookingAutomationEnabled: missedCall.business.bookingAutomationEnabled,
  })
  const firstQuestion = plan.questions[0]
  const transcript = [
    createAssistantEntry(plan.openingMessage),
    createAssistantEntry(firstQuestion.prompt),
  ]

  const result = await prisma.$transaction(async (tx) => {
    const updatedCall = await tx.missedCall.update({
      where: {
        id: missedCall.id,
      },
      data: {
        status: missedCallStatuses.replied,
        repliedAt: missedCall.repliedAt ?? new Date(),
      },
    })

    const intake = await tx.missedCallAssistantIntake.create({
      data: {
        missedCallId: missedCall.id,
        businessId: missedCall.businessId,
        status: missedCallAssistantStatuses.inProgress,
        currentStep: 0,
        transcript,
        answers: {},
      },
    })

    return {
      intake,
      missedCall: updatedCall,
    }
  })

  try {
    const { jobRun } = await enqueueOpsJob({
      type: "MISSED_CALL_TEXT_BACK",
      name: `Missed-call text to ${missedCall.callerName}`,
      businessId: missedCall.businessId,
      source: "MISSED_CALL_ASSISTANT",
      details: "Send the opening missed-call assistant text.",
      payload: {
        missedCallId: missedCall.id,
        missedCallAssistantIntakeId: result.intake.id,
        message: `${plan.openingMessage}\n\n${firstQuestion.prompt}`,
        purpose: "MISSED_CALL_ASSISTANT_OPENING",
      },
      dedupeKey: `missed-call-text:${missedCall.id}:opening`,
      maxAttempts: 3,
    })

    return {
      ...result,
      alreadyStarted: false,
      textJob: jobRun,
    }
  } catch (queueError) {
    captureException(queueError, {
      requestId,
      source: "services.communications.missed_call_assistant_flow.start_text_queue",
      missedCallId: missedCall.id,
    })

    return {
      ...result,
      alreadyStarted: false,
      textJob: null,
    }
  }
}

export async function applyMissedCallAssistantAnswer({
  missedCall,
  answer,
  requestId = "",
}: ApplyMissedCallAssistantAnswerInput) {
  if (!missedCall.missedCallAssistantIntake) {
    throw new Error("Start the missed-call assistant intake first.")
  }

  if (missedCall.missedCallAssistantIntake.status !== missedCallAssistantStatuses.inProgress) {
    return {
      intake: missedCall.missedCallAssistantIntake,
      lead: missedCall.convertedLead,
      completed: true,
      alreadyCompleted: true,
      nextMessage: "",
    }
  }

  const intake = missedCall.missedCallAssistantIntake
  const plan = getMissedCallAssistantPlan({
    businessName: missedCall.business.name,
    businessType: missedCall.business.businessType,
    callerName: missedCall.callerName,
    bookingAutomationEnabled: missedCall.business.bookingAutomationEnabled,
  })
  const currentQuestion = plan.questions[intake.currentStep]

  if (!currentQuestion) {
    throw new Error("No question is waiting.")
  }

  const answers = {
    ...normalizeMissedCallAssistantAnswers(intake.answers),
    [currentQuestion.key]: answer,
  }
  const transcript = [
    ...normalizeMissedCallAssistantTranscript(intake.transcript),
    createCustomerEntry(answer),
  ]
  const nextStep = intake.currentStep + 1
  const nextQuestion = plan.questions[nextStep]

  if (nextQuestion) {
    const updatedIntake = await prisma.missedCallAssistantIntake.update({
      where: {
        id: intake.id,
      },
      data: {
        currentStep: nextStep,
        answers,
        transcript: [...transcript, createAssistantEntry(nextQuestion.prompt)],
      },
    })

    return {
      intake: updatedIntake,
      lead: null,
      completed: false,
      alreadyCompleted: false,
      nextMessage: nextQuestion.prompt,
    }
  }

  const summary = buildMissedCallAssistantSummary({
    answers,
    businessType: missedCall.business.businessType,
    bookingAutomationEnabled: missedCall.business.bookingAutomationEnabled,
    autoSchedulingEnabled: missedCall.business.autoSchedulingEnabled,
    quoteEstimateEnabled: missedCall.business.quoteEstimateEnabled,
    quoteRules: missedCall.business.quoteRules,
    quoteDisclaimer: missedCall.business.quoteDisclaimer,
    callbackTimeframe: missedCall.business.callbackTimeframe,
    services: missedCall.business.serviceOfferings,
    availabilityWindows: missedCall.business.availabilityWindows,
  })
  const finalMessage = getMissedCallAssistantCustomerConfirmation({
    callbackTimeframe: missedCall.business.callbackTimeframe,
    quoteRequested: summary.quoteRequested,
    schedulingRequested: summary.schedulingRequested,
  })
  const completedTranscript = [...transcript, createAssistantEntry(finalMessage)]
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
  const followUpAt = new Date()
  followUpAt.setDate(followUpAt.getDate() + 1)
  followUpAt.setHours(9, 0, 0, 0)

  const completed = await prisma.$transaction(async (tx) => {
    const lead = missedCall.convertedLead
      ? await tx.lead.update({
          where: {
            id: missedCall.convertedLead.id,
          },
          data: {
            notes: `${missedCall.convertedLead.notes}\n\n${leadNotes}`.trim(),
            status:
              missedCall.convertedLead.status === leadStatuses.new
                ? leadStatuses.current
                : missedCall.convertedLead.status,
            followUpAt: missedCall.convertedLead.followUpAt ?? followUpAt,
            followUpNote: summary.nextAction,
            serviceOfferingId:
              summary.matchedServiceId ??
              missedCall.convertedLead.serviceOfferingId,
          },
        })
      : await tx.lead.create({
          data: {
            businessId: missedCall.businessId,
            customerName: missedCall.callerName,
            customerPhone: missedCall.callerPhone,
            source: "MISSED_CALL",
            status: leadStatuses.current,
            estimatedValueCents: getAverageLeadValueCents(
              missedCall.business.businessType
            ),
            notes: leadNotes,
            followUpAt,
            followUpNote: summary.nextAction,
            serviceOfferingId: summary.matchedServiceId,
            createdAt: missedCall.createdAt,
          },
        })

    if (!missedCall.convertedLeadId) {
      await tx.missedCall.update({
        where: {
          id: missedCall.id,
        },
        data: {
          convertedLeadId: lead.id,
        },
      })
    }

    const updatedIntake = await tx.missedCallAssistantIntake.update({
      where: {
        id: intake.id,
      },
      data: {
        status: missedCallAssistantStatuses.readyForOwner,
        currentStep: nextStep,
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
        transcript: completedTranscript,
        answers,
        aiProvider: "RULES",
        aiModel: "",
        aiError: "",
        leadId: lead.id,
      },
    })

    await syncCustomerJobFromLead(tx, lead, {
      createActivity: true,
      activityType: "AI_INTAKE_READY",
      activityTitle: "missed-call assistant intake ready",
      activityBody: `${summary.summary}\n\nNext action: ${summary.nextAction}`,
      activitySource: "MISSED_CALL_ASSISTANT",
      authorName: "LeadReply AI",
    })

    return {
      intake: updatedIntake,
      lead,
    }
  })

  try {
    await enqueueOpsJob({
      type: "MISSED_CALL_ASSISTANT_INTAKE",
      name: `LeadReply missed-call assistant refinement for ${missedCall.callerName}`,
      businessId: missedCall.businessId,
      source: "MISSED_CALL_ASSISTANT",
      details:
        "Refine the rules-based missed-call assistant summary with the configured AI provider.",
      payload: {
        intakeId: completed.intake.id,
      },
      dedupeKey: `missed-call-assistant-ai:${completed.intake.id}`,
      maxAttempts: 2,
    })
  } catch (queueError) {
    captureException(queueError, {
      requestId,
      source: "services.communications.missed_call_assistant_flow.ai_queue",
      missedCallId: missedCall.id,
    })
  }

  return {
    ...completed,
    completed: true,
    alreadyCompleted: false,
    nextMessage: finalMessage,
  }
}
