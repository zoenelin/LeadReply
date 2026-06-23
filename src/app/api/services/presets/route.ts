import {
  getIndustryAvailabilityPresets,
  getIndustryServicePresets,
} from "@/lib/domain/industry-presets"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
    include: {
      serviceOfferings: {
        select: {
          name: true,
        },
      },
      availabilityWindows: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!business) {
    return Response.json(
      { error: "Please finish business setup before adding presets." },
      { status: 400 }
    )
  }

  const existingNames = new Set(
    business.serviceOfferings.map((service) => service.name.toLowerCase())
  )
  const servicePresets = getIndustryServicePresets(business.businessType).filter(
    (service) => !existingNames.has(service.name.toLowerCase())
  )
  const availabilityPresets =
    business.availabilityWindows.length === 0
      ? getIndustryAvailabilityPresets(business.businessType)
      : []

  if (servicePresets.length === 0 && availabilityPresets.length === 0) {
    return Response.json({
      addedServices: 0,
      addedAvailabilityWindows: 0,
    })
  }

  try {
    await prisma.$transaction([
      ...servicePresets.map((servicePreset) =>
        prisma.serviceOffering.create({
          data: {
            ...servicePreset,
            businessId: business.id,
            displayOrder:
              business.serviceOfferings.length + servicePreset.displayOrder,
          },
        })
      ),
      ...availabilityPresets.map((availabilityPreset) =>
        prisma.availabilityWindow.create({
          data: {
            ...availabilityPreset,
            businessId: business.id,
          },
        })
      ),
    ])

    return Response.json({
      addedServices: servicePresets.length,
      addedAvailabilityWindows: availabilityPresets.length,
    })
  } catch {
    return Response.json(
      { error: "Something went wrong adding presets." },
      { status: 500 }
    )
  }
}
