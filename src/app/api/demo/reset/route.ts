import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import {
  buildConciergeLeadNotes,
  buildConciergeSummary,
  createAssistantEntry,
  createCustomerEntry,
  getConciergePlan,
} from "@/lib/concierge-intake"
import { getSuggestedFollowUpSteps } from "@/lib/follow-up-sequences"
import {
  getAverageLeadValueCents,
  getStarterLeads,
  getStarterMissedCalls,
} from "@/lib/demo-data"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
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
      prisma.conciergeIntake.deleteMany({
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

    const wonLeads = await prisma.lead.findMany({
      where: {
        businessId: business.id,
        status: "WON",
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    if (wonLeads.length > 0) {
      const now = new Date()
      await prisma.reviewRequest.createMany({
        data: wonLeads.slice(0, 3).map((lead, index) => ({
          businessId: business.id,
          leadId: lead.id,
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          message: `Thanks for choosing ${business.name}. Would you mind leaving us a quick review?`,
          status: index === 0 ? "RECEIVED" : index === 1 ? "SENT" : "DRAFT",
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
      const plan = getConciergePlan({
        businessName: business.name,
        businessType: business.businessType,
        callerName: newestMissedCall.callerName,
        bookingAutomationEnabled: business.bookingAutomationEnabled,
      })
      const answers = Object.fromEntries(
        plan.questions.map((question) => [question.key, question.sampleAnswer])
      )
      const summary = buildConciergeSummary({
        answers,
        businessType: business.businessType,
        bookingAutomationEnabled: business.bookingAutomationEnabled,
        autoSchedulingEnabled: business.autoSchedulingEnabled,
        quoteEstimateEnabled: business.quoteEstimateEnabled,
        quoteRules: business.quoteRules,
        quoteDisclaimer: business.quoteDisclaimer,
        callbackTimeframe: business.callbackTimeframe,
      })
      const leadNotes = buildConciergeLeadNotes({
        summary: summary.summary,
        nextAction: summary.nextAction,
        schedulingMode: summary.schedulingMode,
        quoteGuidance: summary.quoteGuidance,
        answers,
      })
      const conciergeLead = await prisma.lead.create({
        data: {
          businessId: business.id,
          customerName: newestMissedCall.callerName,
          customerPhone: newestMissedCall.callerPhone,
          source: "MISSED_CALL",
          status: "CONTACTED",
          estimatedValueCents: getAverageLeadValueCents(business.businessType),
          notes: leadNotes,
          followUpAt: new Date(),
          followUpNote: summary.nextAction,
          createdAt: newestMissedCall.createdAt,
        },
      })

      await prisma.missedCall.update({
        where: {
          id: newestMissedCall.id,
        },
        data: {
          status: "REPLIED",
          repliedAt: new Date(),
          convertedLeadId: conciergeLead.id,
        },
      })

      await prisma.conciergeIntake.create({
        data: {
          missedCallId: newestMissedCall.id,
          businessId: business.id,
          leadId: conciergeLead.id,
          status: "READY_FOR_OWNER",
          currentStep: plan.questions.length,
          intent: summary.intent,
          urgency: summary.urgency,
          preferredTime: summary.preferredTime,
          schedulingRequested: summary.schedulingRequested,
          schedulingMode: summary.schedulingMode,
          quoteRequested: summary.quoteRequested,
          quoteGuidance: summary.quoteGuidance,
          summary: summary.summary,
          nextAction: summary.nextAction,
          answers,
          transcript: [
            createAssistantEntry(plan.openingMessage),
            ...plan.questions.flatMap((question) => [
              createAssistantEntry(question.prompt),
              createCustomerEntry(answers[question.key]),
            ]),
            createAssistantEntry(
              "Thanks. I sent that to the team so they can follow up with the right next step."
            ),
          ],
        },
      })
    }

    const openLeads = await prisma.lead.findMany({
      where: {
        businessId: business.id,
        status: {
          in: ["NEW", "CONTACTED"],
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
            status: leadIndex === 0 && stepIndex === 0 ? "SENT" : "DRAFT",
            sentAt: leadIndex === 0 && stepIndex === 0 ? now : null,
          }))
        ),
      })
    }

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
