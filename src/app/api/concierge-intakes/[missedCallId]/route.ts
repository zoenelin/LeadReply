import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import {
  buildConciergeLeadNotes,
  buildConciergeSummary,
  createAssistantEntry,
  createCustomerEntry,
  getConciergePlan,
  normalizeConciergeAnswers,
  normalizeConciergeTranscript,
} from "@/lib/concierge-intake"
import { getAverageLeadValueCents } from "@/lib/demo-data"
import { refineConciergeSummary } from "@/lib/openai-concierge"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const conciergeAnswerSchema = z.object({
  answer: z.string().trim().min(1, "Please enter the customer's answer."),
})

async function findUserMissedCall(id: string, userId: string) {
  return prisma.missedCall.findFirst({
    where: {
      id,
      business: {
        userId,
      },
    },
    include: {
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
      conciergeIntake: true,
    },
  })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ missedCallId: string }> }
) {
  const crossSite = rejectCrossSiteRequest(_req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { missedCallId } = await params
  const missedCall = await findUserMissedCall(missedCallId, session.user.id)

  if (!missedCall) {
    return Response.json({ error: "Missed call not found." }, { status: 404 })
  }

  if (missedCall.conciergeIntake) {
    return Response.json({
      intake: missedCall.conciergeIntake,
      missedCall,
      alreadyStarted: true,
    })
  }

  try {
    const plan = getConciergePlan({
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
          status: "REPLIED",
          repliedAt: missedCall.repliedAt ?? new Date(),
        },
      })

      const intake = await tx.conciergeIntake.create({
        data: {
          missedCallId: missedCall.id,
          businessId: missedCall.businessId,
          status: "IN_PROGRESS",
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

    return Response.json(result, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong starting the concierge intake." },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ missedCallId: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { missedCallId } = await params
  const missedCall = await findUserMissedCall(missedCallId, session.user.id)

  if (!missedCall?.conciergeIntake) {
    return Response.json(
      { error: "Start the concierge intake first." },
      { status: 404 }
    )
  }

  if (missedCall.conciergeIntake.status !== "IN_PROGRESS") {
    return Response.json({
      intake: missedCall.conciergeIntake,
      lead: missedCall.convertedLead,
      alreadyCompleted: true,
    })
  }

  try {
    const body = await req.json()
    const result = conciergeAnswerSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const intake = missedCall.conciergeIntake
    const plan = getConciergePlan({
      businessName: missedCall.business.name,
      businessType: missedCall.business.businessType,
      callerName: missedCall.callerName,
      bookingAutomationEnabled: missedCall.business.bookingAutomationEnabled,
    })
    const currentQuestion = plan.questions[intake.currentStep]

    if (!currentQuestion) {
      return Response.json({ error: "No question is waiting." }, { status: 400 })
    }

    const answers = {
      ...normalizeConciergeAnswers(intake.answers),
      [currentQuestion.key]: result.data.answer,
    }
    const transcript = [
      ...normalizeConciergeTranscript(intake.transcript),
      createCustomerEntry(result.data.answer),
    ]
    const nextStep = intake.currentStep + 1
    const nextQuestion = plan.questions[nextStep]

    if (nextQuestion) {
      const updatedIntake = await prisma.conciergeIntake.update({
        where: {
          id: intake.id,
        },
        data: {
          currentStep: nextStep,
          answers,
          transcript: [...transcript, createAssistantEntry(nextQuestion.prompt)],
        },
      })

      return Response.json({ intake: updatedIntake })
    }

    const baseSummary = buildConciergeSummary({
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
    const refinedSummary = await refineConciergeSummary({
      baseSummary,
      businessName: missedCall.business.name,
      businessType: missedCall.business.businessType,
      answers,
    })
    const summary = refinedSummary.summary
    const completedTranscript = [
      ...transcript,
      createAssistantEntry(
        "Thanks. I sent that to the team so they can follow up with the right next step."
      ),
    ]
    const leadNotes = buildConciergeLeadNotes({
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
                missedCall.convertedLead.status === "NEW"
                  ? "CONTACTED"
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
              status: "CONTACTED",
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

      const updatedIntake = await tx.conciergeIntake.update({
        where: {
          id: intake.id,
        },
        data: {
          status: "READY_FOR_OWNER",
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
          aiProvider: refinedSummary.aiProvider,
          aiModel: refinedSummary.aiModel,
          aiError: refinedSummary.aiError,
          leadId: lead.id,
        },
      })

      return {
        intake: updatedIntake,
        lead,
      }
    })

    return Response.json(completed)
  } catch {
    return Response.json(
      { error: "Something went wrong updating the concierge intake." },
      { status: 500 }
    )
  }
}
