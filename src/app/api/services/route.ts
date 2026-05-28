import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { dollarsToCents } from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Please enter a service name."),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  estimateLow: z.string().optional().default(""),
  estimateHigh: z.string().optional().default(""),
  durationMinutes: z.coerce.number().int().min(5).max(1440),
  bookableOnline: z.boolean(),
  ownerConfirmRequired: z.boolean(),
  active: z.boolean(),
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

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          serviceOfferings: true,
        },
      },
    },
  })

  if (!business) {
    return Response.json(
      { error: "Please finish business setup before adding services." },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const result = serviceSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }
    const estimateLowCents = dollarsToCents(result.data.estimateLow)
    const estimateHighCents = dollarsToCents(result.data.estimateHigh)

    if (
      estimateLowCents > 0 &&
      estimateHighCents > 0 &&
      estimateHighCents < estimateLowCents
    ) {
      return Response.json(
        { error: "High estimate must be greater than the low estimate." },
        { status: 400 }
      )
    }

    const service = await prisma.serviceOffering.create({
      data: {
        businessId: business.id,
        name: result.data.name,
        description: result.data.description,
        category: result.data.category,
        estimateLowCents,
        estimateHighCents,
        durationMinutes: result.data.durationMinutes,
        bookableOnline: result.data.bookableOnline,
        ownerConfirmRequired: result.data.ownerConfirmRequired,
        active: result.data.active,
        displayOrder: business._count.serviceOfferings,
      },
    })

    return Response.json({ service }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong saving the service." },
      { status: 500 }
    )
  }
}
