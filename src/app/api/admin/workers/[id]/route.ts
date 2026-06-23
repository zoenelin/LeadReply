import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import { updateInternalWorker } from "@/services/admin/operations"
import {
  internalWorkerRoles,
  internalWorkerStatuses,
} from "@/services/admin/options"

const workerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(internalWorkerRoles).optional(),
  status: z.enum(internalWorkerStatuses).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardAdminMutation(req, "workers")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = workerUpdateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const worker = await updateInternalWorker(id, result.data)

    logAdminAction("worker.updated", {
      adminEmail: admin.session.user.email,
      workerId: worker.id,
    })

    return Response.json({ worker })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "worker.update",
      adminEmail: admin.session.user.email,
      workerId: id,
    })
  }
}
