import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  createAdminGrowthTask,
  parseOptionalAdminDate,
} from "@/services/admin/operations"
import {
  adminGrowthTaskCategories,
  adminGrowthTaskSources,
  adminGrowthTaskStatuses,
  internalPriorities,
} from "@/services/admin/options"

const growthTaskSchema = z.object({
  businessId: z.string().trim().min(1, "Please select a client."),
  title: z.string().trim().min(1, "Please enter a task title.").max(140),
  description: z.string().trim().max(1200).optional().default(""),
  category: z.enum(adminGrowthTaskCategories).optional().default("SEO"),
  status: z.enum(adminGrowthTaskStatuses).optional().default("TODO"),
  priority: z.enum(internalPriorities).optional().default("MEDIUM"),
  source: z.enum(adminGrowthTaskSources).optional().default("MANUAL"),
  dueAt: z.string().trim().optional().default(""),
})

export async function POST(req: Request) {
  const guard = guardAdminMutation(req, "growth-tasks")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const body = await req.json().catch(() => ({}))
  const result = growthTaskSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const task = await createAdminGrowthTask({
      ...result.data,
      dueAt: parseOptionalAdminDate(result.data.dueAt),
    })

    logAdminAction("growth_task.created", {
      adminEmail: admin.session.user.email,
      taskId: task.id,
      businessId: task.businessId,
    })

    return Response.json({ task }, { status: 201 })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "growth_task.create",
      adminEmail: admin.session.user.email,
    })
  }
}
