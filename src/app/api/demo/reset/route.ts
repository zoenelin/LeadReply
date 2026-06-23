import {
  buildMissedCallAssistantLeadNotes,
  buildMissedCallAssistantSummary,
  createAssistantEntry,
  createCustomerEntry,
  getMissedCallAssistantCustomerConfirmation,
  getMissedCallAssistantPlan,
} from "@/lib/domain/missed-call-assistant"
import { getSuggestedFollowUpSteps } from "@/lib/domain/follow-up-sequences"
import {
  getAverageLeadValueCents,
  getStarterLeads,
  getStarterMissedCalls,
} from "@/lib/data/demo-data"
import { prisma } from "@/lib/data/prisma"
import {
  communicationStatuses,
  missedCallAssistantStatuses,
  leadStatuses,
  missedCallStatuses,
  opsJobStatuses,
  openLeadStatuses,
} from "@/lib/domain/status"
import { phoneLookupKey } from "@/services/communications/sms-messages"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
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
  })

  if (!business) {
    return Response.json(
      { error: "Please finish business setup before resetting demo data." },
      { status: 400 }
    )
  }

  try {
    await prisma.$transaction([
      prisma.smsMessage.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
      prisma.opsJobRun.deleteMany({
        where: {
          businessId: business.id,
          source: "DEMO",
        },
      }),
      prisma.missedCallAssistantIntake.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
      prisma.followUpStep.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
      prisma.reviewRequest.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
      prisma.teamNote.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
      prisma.missedCall.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
      prisma.lead.deleteMany({
        where: {
          businessId: business.id,
        },
      }),
    ])

    const starterLeads = getStarterLeads(business.id, business.businessType)
    const starterMissedCalls = getStarterMissedCalls(
      business.id,
      business.businessType
    )

    await prisma.$transaction([
      prisma.lead.createMany({
        data: starterLeads,
      }),
      prisma.missedCall.createMany({
        data: starterMissedCalls,
      }),
    ])

    const capturedLeads = await prisma.lead.findMany({
      where: {
        businessId: business.id,
        status: leadStatuses.captured,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    if (capturedLeads.length > 0) {
      const now = new Date()
      await prisma.reviewRequest.createMany({
        data: capturedLeads.slice(0, 3).map((lead, index) => ({
          businessId: business.id,
          leadId: lead.id,
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          message: `Thanks for choosing ${business.name}. Would you mind leaving us a quick review?`,
          status:
            index === 0
              ? communicationStatuses.received
              : index === 1
                ? communicationStatuses.sent
                : communicationStatuses.draft,
          sentAt: index <= 1 ? now : null,
          receivedAt: index === 0 ? now : null,
        })),
      })
    }

    const newestMissedCall = await prisma.missedCall.findFirst({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (newestMissedCall) {
      const plan = getMissedCallAssistantPlan({
        businessName: business.name,
        businessType: business.businessType,
        callerName: newestMissedCall.callerName,
        bookingAutomationEnabled: business.bookingAutomationEnabled,
      })
      const answers = Object.fromEntries(
        plan.questions.map((question) => [question.key, question.sampleAnswer])
      )
      const summary = buildMissedCallAssistantSummary({
        answers,
        businessType: business.businessType,
        bookingAutomationEnabled: business.bookingAutomationEnabled,
        autoSchedulingEnabled: business.autoSchedulingEnabled,
        quoteEstimateEnabled: business.quoteEstimateEnabled,
        quoteRules: business.quoteRules,
        quoteDisclaimer: business.quoteDisclaimer,
        callbackTimeframe: business.callbackTimeframe,
        services: business.serviceOfferings,
        availabilityWindows: business.availabilityWindows,
      })
      const customerConfirmation = getMissedCallAssistantCustomerConfirmation({
        callbackTimeframe: business.callbackTimeframe,
        quoteRequested: summary.quoteRequested,
        schedulingRequested: summary.schedulingRequested,
      })
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
      const missedCallAssistantLead = await prisma.lead.create({
        data: {
          businessId: business.id,
          customerName: newestMissedCall.callerName,
          customerPhone: newestMissedCall.callerPhone,
          source: "MISSED_CALL",
          status: leadStatuses.current,
          estimatedValueCents: getAverageLeadValueCents(business.businessType),
          notes: leadNotes,
          followUpAt: new Date(),
          followUpNote: summary.nextAction,
          serviceOfferingId: summary.matchedServiceId,
          createdAt: newestMissedCall.createdAt,
        },
      })

      await prisma.missedCall.update({
        where: {
          id: newestMissedCall.id,
        },
        data: {
          status: missedCallStatuses.replied,
          repliedAt: new Date(),
          convertedLeadId: missedCallAssistantLead.id,
        },
      })

      const missedCallAssistantIntake = await prisma.missedCallAssistantIntake.create({
        data: {
          missedCallId: newestMissedCall.id,
          businessId: business.id,
          leadId: missedCallAssistantLead.id,
          status: missedCallAssistantStatuses.readyForOwner,
          currentStep: plan.questions.length,
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
          answers,
          transcript: [
            createAssistantEntry(plan.openingMessage),
            ...plan.questions.flatMap((question) => [
              createAssistantEntry(question.prompt),
              createCustomerEntry(answers[question.key]),
            ]),
            createAssistantEntry(customerConfirmation),
          ],
        },
      })

      await prisma.smsMessage.createMany({
        data: [
          {
            businessId: business.id,
            missedCallId: newestMissedCall.id,
            missedCallAssistantIntakeId: missedCallAssistantIntake.id,
            direction: "OUTBOUND",
            status: communicationStatuses.delivered,
            provider: "TWILIO",
            fromPhone: business.phone,
            fromPhoneNormalized: phoneLookupKey(business.phone),
            toPhone: newestMissedCall.callerPhone,
            toPhoneNormalized: phoneLookupKey(newestMissedCall.callerPhone),
            body: `${plan.openingMessage}\n\n${plan.questions[0]?.prompt}`,
            purpose: "MISSED_CALL_ASSISTANT_OPENING",
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
          {
            businessId: business.id,
            missedCallId: newestMissedCall.id,
            missedCallAssistantIntakeId: missedCallAssistantIntake.id,
            direction: "INBOUND",
            status: communicationStatuses.received,
            provider: "TWILIO",
            fromPhone: newestMissedCall.callerPhone,
            fromPhoneNormalized: phoneLookupKey(newestMissedCall.callerPhone),
            toPhone: business.phone,
            toPhoneNormalized: phoneLookupKey(business.phone),
            body: answers[plan.questions[0]?.key ?? ""] ?? "I need help.",
            purpose: "MISSED_CALL_ASSISTANT_REPLY",
            receivedAt: new Date(),
          },
          {
            businessId: business.id,
            missedCallId: newestMissedCall.id,
            missedCallAssistantIntakeId: missedCallAssistantIntake.id,
            direction: "OUTBOUND",
            status: communicationStatuses.delivered,
            provider: "TWILIO",
            fromPhone: business.phone,
            fromPhoneNormalized: phoneLookupKey(business.phone),
            toPhone: newestMissedCall.callerPhone,
            toPhoneNormalized: phoneLookupKey(newestMissedCall.callerPhone),
            body: customerConfirmation,
            purpose: "MISSED_CALL_ASSISTANT_CONFIRMATION",
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        ],
      })
    }

    const openLeads = await prisma.lead.findMany({
      where: {
        businessId: business.id,
        status: {
          in: [...openLeadStatuses],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 3,
    })

    if (openLeads.length > 0) {
      const now = new Date()
      await prisma.followUpStep.createMany({
        data: openLeads.flatMap((lead, leadIndex) =>
          getSuggestedFollowUpSteps({
            businessName: business.name,
            businessType: business.businessType,
            customerName: lead.customerName,
            requestContext: lead.followUpNote || lead.notes,
          }).map((step, stepIndex) => ({
            businessId: business.id,
            leadId: lead.id,
            title: step.title,
            message: step.message,
            channel: step.channel,
            stepOrder: step.stepOrder,
            dueAt: step.dueAt,
            status:
              leadIndex === 0 && stepIndex === 0
                ? communicationStatuses.sent
                : communicationStatuses.draft,
            sentAt: leadIndex === 0 && stepIndex === 0 ? now : null,
          }))
        ),
      })
    }

    const teamNoteLeads = await prisma.lead.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
    })

    if (teamNoteLeads.length > 0) {
      const noteBodies = [
        "missed-call assistant intake reviewed. Confirm the schedule before giving any quote.",
        "Customer is warm. Send the next follow-up before the end of the day.",
        "Captured customer is ready for a review request after service completion.",
        "Check source and timing so this lead improves the analytics story.",
      ]

      await prisma.teamNote.createMany({
        data: teamNoteLeads.map((lead, index) => ({
          businessId: business.id,
          leadId: lead.id,
          authorName: index % 2 === 0 ? "Owner" : "Front desk",
          body: noteBodies[index] ?? "Customer details reviewed.",
        })),
      })
    }

    const jobNow = new Date()
    await prisma.opsJobRun.createMany({
      data: [
        {
          businessId: business.id,
          name: "Demo missed-call text back",
          kind: "MISSED_CALL_SMS",
          status: opsJobStatuses.succeeded,
          source: "DEMO",
          queueName: "leadreply-automation",
          queueJobId: "demo-missed-call-sms",
          details: "Sent the first missed-call response and recorded the SMS.",
          queuedAt: jobNow,
          startedAt: jobNow,
          finishedAt: jobNow,
        },
        {
          businessId: business.id,
          name: "Demo missed-call assistant intake summary",
          kind: "MISSED_CALL_ASSISTANT_INTAKE",
          status: opsJobStatuses.succeeded,
          source: "DEMO",
          queueName: "leadreply-automation",
          queueJobId: "demo-ai-intake",
          details:
            "Generated an owner-ready summary with scheduling and quote rules.",
          queuedAt: jobNow,
          startedAt: jobNow,
          finishedAt: jobNow,
        },
        {
          businessId: business.id,
          name: "Demo website audit",
          kind: "WEBSITE_AUDIT",
          status: opsJobStatuses.planned,
          source: "DEMO",
          details:
            "Placeholder for the deep audit job that will run through the worker.",
          scheduledFor: jobNow,
        },
      ],
    })

    return Response.json({
      message: "Demo data reset.",
      leads: starterLeads.length,
      missedCalls: starterMissedCalls.length,
    })
  } catch {
    return Response.json(
      { error: "Something went wrong resetting demo data." },
      { status: 500 }
    )
  }
}
