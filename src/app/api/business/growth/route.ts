import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

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

  const auth = await requireApiBusinessAccess("requestGrowthServices", req)

  if ("response" in auth) {
    return auth.response
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
        id: auth.access.businessId,
      },
      data: result.data,
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong updating SEO and marketing setup." },
      { status: 500 }
    )
  }
}
