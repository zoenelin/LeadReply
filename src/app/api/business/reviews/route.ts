import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const reviewSettingsSchema = z
  .object({
    reviewDiscountEnabled: z.boolean(),
    reviewDiscountOffer: z.string().trim().max(180).optional().default(""),
  })
  .refine(
    (data) =>
      !data.reviewDiscountEnabled || data.reviewDiscountOffer.length > 0,
    {
      message: "Enter the discount offer before turning this on.",
      path: ["reviewDiscountOffer"],
    }
  )

export async function PUT(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageReviews", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const body = await req.json()
    const result = reviewSettingsSchema.safeParse(body)

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
      { error: "Something went wrong updating review settings." },
      { status: 500 }
    )
  }
}
