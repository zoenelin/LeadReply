import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { businessRoles } from "@/lib/security/permissions"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const updateSchema = z.object({
  role: z.enum(businessRoles).optional(),
  status: z.enum(["INVITED", "ACTIVE", "DISABLED"]).optional(),
})

async function getOwnedTeamMember(id: string, businessId: string) {
  return prisma.teamMember.findFirst({
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

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existing = await getOwnedTeamMember(id, auth.access.businessId)

  if (!existing) {
    return Response.json({ error: "Team member not found." }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const member = await prisma.teamMember.update({
    where: {
      id,
    },
    data: result.data,
  })

  return Response.json({ member })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existing = await getOwnedTeamMember(id, auth.access.businessId)

  if (!existing) {
    return Response.json({ error: "Team member not found." }, { status: 404 })
  }

  await prisma.teamMember.delete({
    where: {
      id,
    },
  })

  return Response.json({ message: "Team member removed." })
}
