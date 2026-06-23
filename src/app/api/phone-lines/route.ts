import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import {
  getRoutingTargetLimit,
  hasReachedPhoneLineLimit,
  normalizePhoneNumber,
} from "@/services/communications/phone-lines"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const routeTargetSchema = z.object({
  label: z.string().trim().max(80).optional().default(""),
  phoneNumber: z.string().trim().min(7, "Enter a routing phone number."),
})

const phoneLineSchema = z.object({
  label: z.string().trim().max(80).optional().default(""),
  phoneNumber: z.string().trim().min(7, "Enter the LeadReply phone number."),
  provider: z.string().trim().max(40).optional().default("TWILIO"),
  providerLineId: z.string().trim().max(120).optional().default(""),
  routingTarget: z
    .string()
    .trim()
    .min(7, "Enter the phone number this line should forward to."),
  routingStrategy: z
    .enum(["PRIMARY", "ROUND_ROBIN", "AFTER_HOURS", "DEPARTMENT"])
    .optional()
    .default("PRIMARY"),
  planRequired: z.enum(["BASIC", "GROWTH", "COMPLETE"]).optional().default("BASIC"),
  active: z.boolean().optional().default(true),
  notes: z.string().trim().max(800).optional().default(""),
  routeTargets: z.array(routeTargetSchema).optional().default([]),
})

function cleanRouteTargets({
  routeTargets,
  fallbackRoutingTarget,
  limit,
}: {
  routeTargets: z.infer<typeof routeTargetSchema>[]
  fallbackRoutingTarget: string
  limit: number
}) {
  const targets =
    routeTargets.length > 0
      ? routeTargets
      : [
          {
            label: "Primary",
            phoneNumber: fallbackRoutingTarget,
          },
        ]

  return targets
    .map((target) => ({
      label: target.label.trim(),
      phoneNumber: target.phoneNumber.trim(),
      phoneNumberNormalized: normalizePhoneNumber(target.phoneNumber),
    }))
    .filter((target) => target.phoneNumberNormalized)
    .slice(0, limit)
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("managePhoneLines", req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
    select: {
      id: true,
      selectedPlan: true,
      _count: {
        select: {
          phoneLines: true,
        },
      },
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  if (
    hasReachedPhoneLineLimit({
      currentCount: business._count.phoneLines,
      selectedPlan: business.selectedPlan,
    })
  ) {
    return Response.json(
      {
        error:
          "This plan has reached its phone-line limit. Upgrade the plan before adding another line.",
      },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const result = phoneLineSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const phoneNumberNormalized = normalizePhoneNumber(result.data.phoneNumber)
  const routeTargetLimit = getRoutingTargetLimit(business.selectedPlan)
  const routeTargets = cleanRouteTargets({
    routeTargets: result.data.routeTargets,
    fallbackRoutingTarget: result.data.routingTarget,
    limit: routeTargetLimit,
  })
  const primaryRouteTarget = routeTargets[0]

  if (!phoneNumberNormalized || !primaryRouteTarget) {
    return Response.json(
      { error: "Enter valid phone numbers for the line and routing target." },
      { status: 400 }
    )
  }

  if (result.data.routeTargets.length > routeTargetLimit) {
    return Response.json(
      {
        error: `This plan supports ${routeTargetLimit} routing phone${
          routeTargetLimit === 1 ? "" : "s"
        } per line.`,
      },
      { status: 400 }
    )
  }

  try {
    const phoneLine = await prisma.$transaction(async (tx) =>
      tx.businessPhoneLine.create({
        data: {
          businessId: business.id,
          label: result.data.label,
          phoneNumber: result.data.phoneNumber,
          phoneNumberNormalized,
          provider: result.data.provider,
          providerLineId: result.data.providerLineId,
          routingTarget: primaryRouteTarget.phoneNumber,
          routingTargetNormalized: primaryRouteTarget.phoneNumberNormalized,
          routingStrategy: result.data.routingStrategy,
          planRequired: result.data.planRequired,
          active: result.data.active,
          notes: result.data.notes,
          routeTargets: {
            create: routeTargets.map((target, index) => ({
              businessId: business.id,
              label: target.label || (index === 0 ? "Primary" : `Fallback ${index}`),
              phoneNumber: target.phoneNumber,
              phoneNumberNormalized: target.phoneNumberNormalized,
              sortOrder: index,
              active: true,
            })),
          },
        },
        include: {
          routeTargets: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      })
    )

    return Response.json({ phoneLine }, { status: 201 })
  } catch {
    return Response.json(
      { error: "That phone line is already saved for this business." },
      { status: 400 }
    )
  }
}
