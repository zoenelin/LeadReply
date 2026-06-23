import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import {
  getRoutingTargetLimit,
  normalizePhoneNumber,
} from "@/services/communications/phone-lines"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const routeTargetSchema = z.object({
  label: z.string().trim().max(80).optional().default(""),
  phoneNumber: z.string().trim().min(7, "Enter a routing phone number."),
})

const phoneLineUpdateSchema = z.object({
  label: z.string().trim().max(80).optional(),
  phoneNumber: z.string().trim().min(7).optional(),
  provider: z.string().trim().max(40).optional(),
  providerLineId: z.string().trim().max(120).optional(),
  routingTarget: z.string().trim().min(7).optional(),
  routingStrategy: z
    .enum(["PRIMARY", "ROUND_ROBIN", "AFTER_HOURS", "DEPARTMENT"])
    .optional(),
  planRequired: z.enum(["BASIC", "GROWTH", "COMPLETE"]).optional(),
  active: z.boolean().optional(),
  notes: z.string().trim().max(800).optional(),
  routeTargets: z.array(routeTargetSchema).optional(),
})

async function findBusinessPhoneLine(id: string, businessId: string) {
  return prisma.businessPhoneLine.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      business: {
        select: {
          id: true,
          selectedPlan: true,
        },
      },
      routeTargets: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  })
}

function cleanRouteTargets({
  routeTargets,
  limit,
}: {
  routeTargets: z.infer<typeof routeTargetSchema>[]
  limit: number
}) {
  return routeTargets
    .map((target) => ({
      label: target.label.trim(),
      phoneNumber: target.phoneNumber.trim(),
      phoneNumberNormalized: normalizePhoneNumber(target.phoneNumber),
    }))
    .filter((target) => target.phoneNumberNormalized)
    .slice(0, limit)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("managePhoneLines", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existing = await findBusinessPhoneLine(id, auth.access.businessId)

  if (!existing) {
    return Response.json({ error: "Phone line not found." }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result = phoneLineUpdateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const routeTargetLimit = getRoutingTargetLimit(existing.business.selectedPlan)
  const routeTargets = result.data.routeTargets
    ? cleanRouteTargets({
        routeTargets: result.data.routeTargets,
        limit: routeTargetLimit,
      })
    : null

  if (result.data.routeTargets && result.data.routeTargets.length > routeTargetLimit) {
    return Response.json(
      {
        error: `This plan supports ${routeTargetLimit} routing phone${
          routeTargetLimit === 1 ? "" : "s"
        } per line.`,
      },
      { status: 400 }
    )
  }

  if (result.data.routeTargets && routeTargets?.length === 0) {
    return Response.json(
      { error: "Enter at least one valid routing phone number." },
      { status: 400 }
    )
  }

  const primaryRouteTarget = routeTargets?.[0]
  const data: Prisma.BusinessPhoneLineUpdateInput = {}

  if (result.data.label !== undefined) {
    data.label = result.data.label
  }

  if (result.data.phoneNumber !== undefined) {
    data.phoneNumber = result.data.phoneNumber
    data.phoneNumberNormalized = normalizePhoneNumber(result.data.phoneNumber)
  }

  if (result.data.provider !== undefined) {
    data.provider = result.data.provider
  }

  if (result.data.providerLineId !== undefined) {
    data.providerLineId = result.data.providerLineId
  }

  if (result.data.routingStrategy !== undefined) {
    data.routingStrategy = result.data.routingStrategy
  }

  if (result.data.planRequired !== undefined) {
    data.planRequired = result.data.planRequired
  }

  if (result.data.active !== undefined) {
    data.active = result.data.active
  }

  if (result.data.notes !== undefined) {
    data.notes = result.data.notes
  }

  if (primaryRouteTarget || result.data.routingTarget !== undefined) {
    const routingTarget =
      primaryRouteTarget?.phoneNumber ?? result.data.routingTarget ?? ""
    data.routingTarget = routingTarget
    data.routingTargetNormalized =
      primaryRouteTarget?.phoneNumberNormalized ??
      normalizePhoneNumber(routingTarget)
  }

  try {
    const phoneLine = await prisma.$transaction(async (tx) => {
      const updatedLine = await tx.businessPhoneLine.update({
        where: {
          id: existing.id,
        },
        data,
      })

      if (routeTargets) {
        await tx.businessPhoneRouteTarget.deleteMany({
          where: {
            businessPhoneLineId: existing.id,
          },
        })
        await tx.businessPhoneRouteTarget.createMany({
          data: routeTargets.map((target, index) => ({
            businessId: existing.business.id,
            businessPhoneLineId: existing.id,
            label: target.label || (index === 0 ? "Primary" : `Fallback ${index}`),
            phoneNumber: target.phoneNumber,
            phoneNumberNormalized: target.phoneNumberNormalized,
            sortOrder: index,
            active: true,
          })),
        })
      }

      return tx.businessPhoneLine.findUnique({
        where: {
          id: updatedLine.id,
        },
        include: {
          routeTargets: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      })
    })

    return Response.json({ phoneLine })
  } catch {
    return Response.json(
      { error: "That phone line is already saved for this business." },
      { status: 400 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("managePhoneLines", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existing = await findBusinessPhoneLine(id, auth.access.businessId)

  if (!existing) {
    return Response.json({ error: "Phone line not found." }, { status: 404 })
  }

  await prisma.businessPhoneLine.delete({
    where: {
      id: existing.id,
    },
  })

  return Response.json({ ok: true })
}
