import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { getStarterLeads, getStarterMissedCalls } from "@/lib/demo-data"
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
