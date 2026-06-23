import {
  buildMissedCallAssistantLeadNotes,
  normalizeMissedCallAssistantAnswers,
} from "@/lib/domain/missed-call-assistant"
import { getAverageLeadValueCents } from "@/lib/data/demo-data"
import { formatMoney } from "@/lib/domain/lead-options"
import { leadStatuses, missedCallStatuses } from "@/lib/domain/status"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { z } from "zod"

const missedCallSchema = z.object({
  status: z.enum([missedCallStatuses.new, missedCallStatuses.replied]),
})

function formatServiceEstimate(lowCents: number, highCents: number) {
  if (lowCents > 0 && highCents > 0 && lowCents !== highCents) {
    return `${formatMoney(lowCents)}-${formatMoney(highCents)}`
  }

  if (lowCents > 0) {
    return `Starts at ${formatMoney(lowCents)}`
  }

  if (highCents > 0) {
    return `Up to ${formatMoney(highCents)}`
  }

  return ""
}

async function findUserMissedCall(id: string, businessId: string) {
  return prisma.missedCall.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      business: true,
      convertedLead: true,
      missedCallAssistantIntake: true,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMessages", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const body = await req.json()
    const result = missedCallSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const { id } = await params

    const missedCall = await findUserMissedCall(id, auth.access.businessId)

    if (!missedCall) {
      return Response.json({ error: "Missed call not found." }, { status: 404 })
    }

    const updatedCall = await prisma.missedCall.update({
      where: {
        id,
      },
      data: {
        status: result.data.status,
        repliedAt:
          result.data.status === missedCallStatuses.replied ? new Date() : null,
      },
    })

    return Response.json({ missedCall: updatedCall })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the missed call." },
      { status: 500 }
    )
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(_req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMessages", _req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const missedCall = await findUserMissedCall(id, auth.access.businessId)

  if (!missedCall) {
    return Response.json({ error: "Missed call not found." }, { status: 404 })
  }

  if (missedCall.convertedLead) {
    return Response.json({
      lead: missedCall.convertedLead,
      alreadyConverted: true,
    })
  }

  const followUpAt = new Date()
  followUpAt.setDate(followUpAt.getDate() + 1)
  followUpAt.setHours(9, 0, 0, 0)

  try {
    const missedCallAssistantNotes = missedCall.missedCallAssistantIntake
      ? buildMissedCallAssistantLeadNotes({
          summary: missedCall.missedCallAssistantIntake.summary || missedCall.reason,
          nextAction:
            missedCall.missedCallAssistantIntake.nextAction ||
            `Follow up from missed call: ${missedCall.reason}`,
          schedulingMode: missedCall.missedCallAssistantIntake.schedulingMode,
          quoteGuidance: missedCall.missedCallAssistantIntake.quoteGuidance,
          matchedServiceName: missedCall.missedCallAssistantIntake.matchedServiceName,
          serviceEstimate:
            missedCall.missedCallAssistantIntake.matchedQuoteLowCents > 0 ||
            missedCall.missedCallAssistantIntake.matchedQuoteHighCents > 0
              ? formatServiceEstimate(
                  missedCall.missedCallAssistantIntake.matchedQuoteLowCents,
                  missedCall.missedCallAssistantIntake.matchedQuoteHighCents
                )
              : "",
          serviceDuration:
            missedCall.missedCallAssistantIntake.matchedDurationMinutes > 0
              ? `${missedCall.missedCallAssistantIntake.matchedDurationMinutes} minutes`
              : "",
          availabilityGuidance: missedCall.missedCallAssistantIntake.availabilityGuidance,
          answers: normalizeMissedCallAssistantAnswers(missedCall.missedCallAssistantIntake.answers),
        })
      : ""
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          businessId: missedCall.businessId,
          customerName: missedCall.callerName,
          customerPhone: missedCall.callerPhone,
          source: "MISSED_CALL",
          sourceDetail:
            missedCall.missedCallAssistantIntake?.matchedServiceName ||
            missedCall.reason,
          status: leadStatuses.new,
          estimatedValueCents: getAverageLeadValueCents(
            missedCall.business.businessType
          ),
          serviceOfferingId: missedCall.missedCallAssistantIntake?.matchedServiceId,
          notes: missedCallAssistantNotes || missedCall.reason,
          followUpAt,
          followUpNote: `Follow up from missed call: ${missedCall.reason}`,
          createdAt: missedCall.createdAt,
        },
      })

      await syncCustomerJobFromLead(tx, createdLead, {
        createActivity: true,
        activityTitle: "Missed call captured",
        activityBody: missedCallAssistantNotes || missedCall.reason,
        activitySource: "MISSED_CALL",
      })

      await tx.missedCall.update({
        where: {
          id: missedCall.id,
        },
        data: {
          convertedLeadId: createdLead.id,
        },
      })

      if (missedCall.missedCallAssistantIntake) {
        await tx.missedCallAssistantIntake.update({
          where: {
            id: missedCall.missedCallAssistantIntake.id,
          },
          data: {
            leadId: createdLead.id,
          },
        })
      }

      return createdLead
    })

    return Response.json({ lead }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong converting the missed call." },
      { status: 500 }
    )
  }
}
