import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const clearSchema = z.object({
  confirmation: z.literal("CLEAR"),
})

export async function POST(req: Request) {
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
    const result = clearSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: "Type CLEAR before clearing launch data." },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (!business) {
      return Response.json({ error: "Business not found." }, { status: 404 })
    }

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

    return Response.json({
      message: "Launch data cleared.",
    })
  } catch {
    return Response.json(
      { error: "Something went wrong clearing launch data." },
      { status: 500 }
    )
  }
}
