import { authOptions } from "@/auth/auth"
import {
  buildConciergeLeadNotes,
  normalizeConciergeAnswers,
} from "@/lib/concierge-intake"
import { getAverageLeadValueCents } from "@/lib/demo-data"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { z } from "zod"

const missedCallSchema = z.object({
  status: z.enum(["NEW", "REPLIED"]),
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
