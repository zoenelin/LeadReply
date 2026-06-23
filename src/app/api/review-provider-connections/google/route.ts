import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { googleReviewProvider } from "@/services/reviews/google-business-profile"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const googleReviewConnectionSchema = z.object({
  accountId: z.string().trim().optional().default(""),
  locationId: z.string().trim().optional().default(""),
  locationName: z.string().trim().optional().default(""),
  accessToken: z.string().trim().optional().default(""),
  refreshToken: z.string().trim().optional().default(""),
  status: z
    .enum(["CONNECTED", "ACTION_REQUIRED", "DISABLED"])
    .optional()
    .default("ACTION_REQUIRED"),
})

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
    const result = googleReviewConnectionSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const {
      accountId,
      locationId,
      locationName,
      accessToken,
      refreshToken,
      status,
    } = result.data
    const connection = await prisma.reviewProviderConnection.upsert({
      where: {
        businessId_provider: {
          businessId: auth.access.businessId,
          provider: googleReviewProvider,
        },
      },
      create: {
        businessId: auth.access.businessId,
        provider: googleReviewProvider,
        status,
        accountId,
        locationId,
        locationName,
        accessTokenEncrypted: accessToken,
        refreshTokenEncrypted: refreshToken,
      },
      update: {
        status,
        accountId,
        locationId,
        locationName,
        accessTokenEncrypted: accessToken || undefined,
        refreshTokenEncrypted: refreshToken || undefined,
      },
    })

    return Response.json({
      connection: {
        id: connection.id,
        provider: connection.provider,
        status: connection.status,
        accountId: connection.accountId,
        locationId: connection.locationId,
        locationName: connection.locationName,
        lastSyncAt: connection.lastSyncAt,
        lastError: connection.lastError,
      },
    })
  } catch {
    return Response.json(
      { error: "Could not update Google review API connection." },
      { status: 500 }
    )
  }
}
