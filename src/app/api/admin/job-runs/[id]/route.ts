import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  parseOptionalAdminDate,
  updateOpsJobRun,
} from "@/services/admin/operations"
import { opsJobStatuses } from "@/services/admin/options"
import { opsJobStatuses as opsJobStatusValues } from "@/lib/domain/status"

const jobUpdateSchema = z.object({
  status: z.enum(opsJobStatuses).optional(),
  details: z.string().trim().max(1600).optional(),
  error: z.string().trim().max(1600).optional(),
  scheduledFor: z.string().trim().optional(),
})

function jobTimestampPatch(status: string | undefined) {
  const now = new Date()

  if (status === opsJobStatusValues.running) {
    return {
      startedAt: now,
      finishedAt: null,
    }
  }

  if (
    status === opsJobStatusValues.succeeded ||
    status === opsJobStatusValues.failed ||
    status === opsJobStatusValues.cancelled
  ) {
    return {
      finishedAt: now,
    }
  }

  return {}
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardAdminMutation(req, "job-runs")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = jobUpdateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const scheduledFor = parseOptionalAdminDate(result.data.scheduledFor)

  if (result.data.scheduledFor !== undefined && scheduledFor === undefined) {
    return Response.json(
      { error: "Please enter a valid scheduled date." },
      { status: 400 }
    )
  }

  try {
    const job = await updateOpsJobRun(id, {
      status: result.data.status,
      details: result.data.details,
      error: result.data.error,
      ...(result.data.scheduledFor !== undefined ? { scheduledFor } : {}),
      ...jobTimestampPatch(result.data.status),
    })

    logAdminAction("job.updated", {
      adminEmail: admin.session.user.email,
      jobId: job.id,
      status: job.status,
    })

    return Response.json({ job })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "job.update",
      adminEmail: admin.session.user.email,
      jobId: id,
    })
  }
}
