import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  createInternalAssignment,
  parseOptionalAdminDate,
} from "@/services/admin/operations"
import {
  internalAssignmentCategories,
  internalAssignmentStatuses,
  internalPriorities,
} from "@/services/admin/options"

const assignmentSchema = z.object({
  businessId: z.string().trim().min(1, "Please select a client."),
  workerId: z.string().trim().optional().default(""),
  title: z.string().trim().min(1, "Please enter a task title.").max(160),
  description: z.string().trim().max(1600).optional().default(""),
  category: z
    .enum(internalAssignmentCategories)
    .optional()
    .default("CLIENT_SETUP"),
  status: z.enum(internalAssignmentStatuses).optional().default("TODO"),
  priority: z.enum(internalPriorities).optional().default("MEDIUM"),
  dueAt: z.string().trim().optional().default(""),
})

export async function POST(req: Request) {
  const guard = guardAdminMutation(req, "assignments")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const body = await req.json().catch(() => ({}))
  const result = assignmentSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const dueAt = parseOptionalAdminDate(result.data.dueAt)

  if (dueAt === undefined) {
    return Response.json({ error: "Please enter a valid due date." }, { status: 400 })
  }

  try {
    const assignment = await createInternalAssignment({
      ...result.data,
      workerId: result.data.workerId || null,
      dueAt,
    })

    logAdminAction("assignment.created", {
      adminEmail: admin.session.user.email,
      assignmentId: assignment.id,
      businessId: assignment.businessId,
    })

    return Response.json({ assignment }, { status: 201 })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "assignment.create",
      adminEmail: admin.session.user.email,
    })
  }
}
