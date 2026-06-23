import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  parseOptionalAdminDate,
  updateInternalAssignment,
} from "@/services/admin/operations"
import {
  internalAssignmentCategories,
  internalAssignmentStatuses,
  internalPriorities,
} from "@/services/admin/options"

const assignmentUpdateSchema = z.object({
  workerId: z.string().trim().optional(),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1600).optional(),
  category: z.enum(internalAssignmentCategories).optional(),
  status: z.enum(internalAssignmentStatuses).optional(),
  priority: z.enum(internalPriorities).optional(),
  dueAt: z.string().trim().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardAdminMutation(req, "assignments")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = assignmentUpdateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const dueAt = parseOptionalAdminDate(result.data.dueAt)

  if (result.data.dueAt !== undefined && dueAt === undefined) {
    return Response.json({ error: "Please enter a valid due date." }, { status: 400 })
  }

  try {
    const assignment = await updateInternalAssignment(id, {
      title: result.data.title,
      description: result.data.description,
      category: result.data.category,
      status: result.data.status,
      priority: result.data.priority,
      workerId:
        result.data.workerId === undefined ? undefined : result.data.workerId || null,
      ...(result.data.dueAt !== undefined ? { dueAt } : {}),
    })

    logAdminAction("assignment.updated", {
      adminEmail: admin.session.user.email,
      assignmentId: assignment.id,
      businessId: assignment.businessId,
    })

    return Response.json({ assignment })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "assignment.update",
      adminEmail: admin.session.user.email,
      assignmentId: id,
    })
  }
}
