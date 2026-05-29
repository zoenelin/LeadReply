import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const textField = z.string().trim().max(4000).optional().default("")

const growthSchema = z.object({
  seoSetupNotes: textField,
  seoPrimaryServices: textField,
  seoServiceAreas: textField,
  seoTargetKeywords: textField,
  seoCompetitors: textField,
  seoWebsitePages: textField,
  seoContentIdeas: textField,
  marketingSetupNotes: textField,
  marketingChannels: textField,
  marketingAudience: textField,
  marketingGoals: textField,
  marketingOffer: textField,
  marketingContentThemes: textField,
  marketingPostingCadence: z
    .enum(["weekly", "twice_weekly", "three_times_weekly", "daily", "seasonal"])
    .optional()
    .default("weekly"),
  marketingBrandVoice: textField,
})

export async function PUT(req: Request) {
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
    const result = growthSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const business = await prisma.business.update({
      where: {
        userId: session.user.id,
      },
      data: result.data,
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong updating growth setup." },
      { status: 500 }
    )
  }
}
