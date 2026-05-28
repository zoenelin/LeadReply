import { authOptions } from "@/auth/auth"
import {
  buildConciergeLeadNotes,
  normalizeConciergeAnswers,
} from "@/lib/concierge-intake"
import { getAverageLeadValueCents } from "@/lib/demo-data"
import { formatMoney } from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"
import { getServerSession } from "next-auth"
import { z } from "zod"

const missedCallSchema = z.object({
  status: z.enum(["NEW", "REPLIED"]),
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

async function findUserMissedCall(id: string, userId: string) {
  return prisma.missedCall.findFirst({
    where: {
      id,
      business: {
        userId,
      },
    },
    include: {
      business: true,
      convertedLead: true,
      conciergeIntake: true,
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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
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

    const missedCall = await findUserMissedCall(id, session.user.id)

    if (!missedCall) {
      return Response.json({ error: "Missed call not found." }, { status: 404 })
    }

    const updatedCall = await prisma.missedCall.update({
      where: {
        id,
      },
      data: {
        status: result.data.status,
        repliedAt: result.data.status === "REPLIED" ? new Date() : null,
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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const missedCall = await findUserMissedCall(id, session.user.id)

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
    const conciergeNotes = missedCall.conciergeIntake
      ? buildConciergeLeadNotes({
          summary: missedCall.conciergeIntake.summary || missedCall.reason,
          nextAction:
            missedCall.conciergeIntake.nextAction ||
            `Follow up from missed call: ${missedCall.reason}`,
          schedulingMode: missedCall.conciergeIntake.schedulingMode,
          quoteGuidance: missedCall.conciergeIntake.quoteGuidance,
          matchedServiceName: missedCall.conciergeIntake.matchedServiceName,
          serviceEstimate:
            missedCall.conciergeIntake.matchedQuoteLowCents > 0 ||
            missedCall.conciergeIntake.matchedQuoteHighCents > 0
              ? formatServiceEstimate(
                  missedCall.conciergeIntake.matchedQuoteLowCents,
                  missedCall.conciergeIntake.matchedQuoteHighCents
                )
              : "",
          serviceDuration:
            missedCall.conciergeIntake.matchedDurationMinutes > 0
              ? `${missedCall.conciergeIntake.matchedDurationMinutes} minutes`
              : "",
          availabilityGuidance: missedCall.conciergeIntake.availabilityGuidance,
          answers: normalizeConciergeAnswers(missedCall.conciergeIntake.answers),
        })
      : ""
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          businessId: missedCall.businessId,
          customerName: missedCall.callerName,
          customerPhone: missedCall.callerPhone,
          source: "MISSED_CALL",
          status: "NEW",
          estimatedValueCents: getAverageLeadValueCents(
            missedCall.business.businessType
          ),
          serviceOfferingId: missedCall.conciergeIntake?.matchedServiceId,
          notes: conciergeNotes || missedCall.reason,
          followUpAt,
          followUpNote: `Follow up from missed call: ${missedCall.reason}`,
          createdAt: missedCall.createdAt,
        },
      })

      await tx.missedCall.update({
        where: {
          id: missedCall.id,
        },
        data: {
          convertedLeadId: createdLead.id,
        },
      })

      if (missedCall.conciergeIntake) {
        await tx.conciergeIntake.update({
          where: {
            id: missedCall.conciergeIntake.id,
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
