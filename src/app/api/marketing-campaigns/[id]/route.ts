import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { dollarsToCents } from "@/lib/domain/lead-options"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const updateSchema = z.object({
  name: z.string().trim().min(1).max(140).optional(),
  channel: z.string().trim().max(80).optional(),
  goal: z.string().trim().max(180).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  cost: z.string().optional(),
  notes: z.string().trim().max(1200).optional(),
})

async function findBusinessCampaign(id: string, businessId: string) {
  return prisma.marketingCampaign.findFirst({
    where: {
      id,
      businessId,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMarketing", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingCampaign = await findBusinessCampaign(id, auth.access.businessId)

  if (!existingCampaign) {
    return Response.json(
      { error: "Marketing campaign not found." },
      { status: 404 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const campaign = await prisma.marketingCampaign.update({
    where: {
      id,
    },
    data: {
      name: result.data.name,
      channel: result.data.channel,
      goal: result.data.goal,
      status: result.data.status,
      notes: result.data.notes,
      ...(result.data.cost !== undefined
        ? { costCents: dollarsToCents(result.data.cost) }
        : {}),
    },
  })

  return Response.json({ campaign })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMarketing", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingCampaign = await findBusinessCampaign(id, auth.access.businessId)

  if (!existingCampaign) {
    return Response.json(
      { error: "Marketing campaign not found." },
      { status: 404 }
    )
  }

  await prisma.marketingCampaign.delete({
    where: {
      id,
    },
  })

  return Response.json({ message: "Marketing campaign removed." })
}
