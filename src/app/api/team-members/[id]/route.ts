import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const updateSchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "STAFF", "VIEWER"]).optional(),
  status: z.enum(["INVITED", "ACTIVE", "DISABLED"]).optional(),
})

async function getOwnedTeamMember(id: string, userId: string) {
  return prisma.teamMember.findFirst({
    where: {
      id,
      business: {
        userId,
      },
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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedTeamMember(id, session.user.id)

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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedTeamMember(id, session.user.id)

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
