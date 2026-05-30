import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const taskSchema = z.object({
  title: z.string().trim().min(1, "Please enter a task title.").max(140),
  description: z.string().trim().max(1200).optional().default(""),
  category: z.enum(["SEO", "MARKETING", "GENERAL"]).optional().default("SEO"),
  status: z
    .enum(["TODO", "IN_PROGRESS", "DONE"])
    .optional()
    .default("TODO"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional().default("MEDIUM"),
  source: z.enum(["MANUAL", "SUGGESTED"]).optional().default("MANUAL"),
  dueAt: z.string().trim().optional().default(""),
})

function parseOptionalDate(value: string) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result = taskSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const task = await prisma.growthTask.create({
    data: {
      businessId: business.id,
      title: result.data.title,
      description: result.data.description,
      category: result.data.category,
      status: result.data.status,
      priority: result.data.priority,
      source: result.data.source,
      dueAt: parseOptionalDate(result.data.dueAt),
    },
  })

  return Response.json({ task }, { status: 201 })
}
