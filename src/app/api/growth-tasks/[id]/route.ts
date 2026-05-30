import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const updateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(1200).optional(),
  category: z.enum(["SEO", "MARKETING", "GENERAL"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  dueAt: z.string().trim().optional(),
})

async function findUserGrowthTask(id: string, userId: string) {
  return prisma.growthTask.findFirst({
    where: {
      id,
      business: {
        userId,
      },
    },
  })
}

function parseOptionalDate(value?: string) {
  if (value === undefined) {
    return undefined
  }

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
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
  const existingTask = await findUserGrowthTask(id, session.user.id)

  if (!existingTask) {
    return Response.json({ error: "Growth task not found." }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const dueAt = parseOptionalDate(result.data.dueAt)

  if (result.data.dueAt !== undefined && dueAt === undefined) {
    return Response.json({ error: "Please enter a valid date." }, { status: 400 })
  }

  const task = await prisma.growthTask.update({
    where: {
      id,
    },
    data: {
      title: result.data.title,
      description: result.data.description,
      category: result.data.category,
      status: result.data.status,
      priority: result.data.priority,
      ...(result.data.dueAt !== undefined ? { dueAt } : {}),
    },
  })

  return Response.json({ task })
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
  const existingTask = await findUserGrowthTask(id, session.user.id)

  if (!existingTask) {
    return Response.json({ error: "Growth task not found." }, { status: 404 })
  }

  await prisma.growthTask.delete({
    where: {
      id,
    },
  })

  return Response.json({ message: "Growth task removed." })
}
