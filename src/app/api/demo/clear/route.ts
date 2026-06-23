import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const clearSchema = z.object({
  confirmation: z.literal("CLEAR"),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
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
        id: auth.access.businessId,
      },
    })

    if (!business) {
      return Response.json({ error: "Business not found." }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.smsMessage.deleteMany({
        where: {
          businessId: business.id,
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
