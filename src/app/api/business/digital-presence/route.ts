import { z } from "zod"
import {
  buildServiceOpportunities,
  normalizePresenceStatus,
} from "@/lib/growth/digital-presence"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const statusSchema = z
  .enum(["UNKNOWN", "CONNECTED", "MISSING", "NEEDS_WORK", "NOT_NEEDED"])
  .optional()
  .default("UNKNOWN")

const textField = z.string().trim().max(4000).optional().default("")
const urlField = z.string().trim().max(600).optional().default("")

const digitalPresenceSchema = z.object({
  website: urlField,
  websitePresenceStatus: statusSchema,
  googleBusinessProfileUrl: urlField,
  googleBusinessProfileStatus: statusSchema,
  facebookPageUrl: urlField,
  facebookPageStatus: statusSchema,
  instagramProfileUrl: urlField,
  instagramProfileStatus: statusSchema,
  calendarBookingUrl: urlField,
  bookingLinkStatus: statusSchema,
  googleReviewUrl: urlField,
  reviewPlatformStatus: statusSchema,
  logoUrl: urlField,
  brandAssetsStatus: statusSchema,
  brandAssetNotes: textField,
  digitalPresenceNotes: textField,
  wantsLeadReplySetupHelp: z.boolean().optional().default(true),
})

export async function PUT(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageSeo", req)

  if ("response" in auth) {
    return auth.response
  }

  const body = await req.json().catch(() => ({}))
  const result = digitalPresenceSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const business = await prisma.business.update({
      where: {
        id: auth.access.businessId,
      },
      data: result.data,
    })
    const opportunities = buildServiceOpportunities(business)
    const currentTypes = opportunities.map((opportunity) => opportunity.type)

    await prisma.$transaction([
      ...opportunities.map((opportunity) =>
        prisma.serviceOpportunity.upsert({
          where: {
            businessId_type: {
              businessId: business.id,
              type: opportunity.type,
            },
          },
          create: {
            ...opportunity,
            businessId: business.id,
          },
          update: {
            title: opportunity.title,
            description: opportunity.description,
            priority: opportunity.priority,
            estimatedValueCents: opportunity.estimatedValueCents,
            status: "OPEN",
            source: "DIGITAL_PRESENCE",
          },
        })
      ),
      prisma.serviceOpportunity.updateMany({
        where: {
          businessId: business.id,
          source: "DIGITAL_PRESENCE",
          type: {
            notIn: currentTypes.length > 0 ? currentTypes : ["__none__"],
          },
          status: "OPEN",
        },
        data: {
          status: "RESOLVED",
        },
      }),
    ])

    return Response.json({
      business: {
        ...business,
        websitePresenceStatus: normalizePresenceStatus(
          business.websitePresenceStatus
        ),
      },
    })
  } catch {
    return Response.json(
      { error: "Something went wrong updating digital presence." },
      { status: 500 }
    )
  }
}
