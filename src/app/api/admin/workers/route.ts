import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import { createInternalWorker } from "@/services/admin/operations"
import {
  internalWorkerRoles,
  internalWorkerStatuses,
} from "@/services/admin/options"

const workerSchema = z.object({
  name: z.string().trim().min(1, "Please enter a worker name.").max(120),
  email: z.email("Please enter a valid email.").trim().toLowerCase().max(160),
  role: z.enum(internalWorkerRoles).optional().default("OPERATIONS"),
  status: z.enum(internalWorkerStatuses).optional().default("ACTIVE"),
})

export async function POST(req: Request) {
  const guard = guardAdminMutation(req, "workers")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const body = await req.json().catch(() => ({}))
  const result = workerSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const worker = await createInternalWorker(result.data)

    logAdminAction("worker.created", {
      adminEmail: admin.session.user.email,
      workerId: worker.id,
    })

    return Response.json({ worker }, { status: 201 })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "worker.create",
      adminEmail: admin.session.user.email,
    })
  }
}
