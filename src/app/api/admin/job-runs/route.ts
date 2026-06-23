import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  createOpsJobRun,
  parseOptionalAdminDate,
} from "@/services/admin/operations"
import { opsJobStatuses as opsJobStatusValues } from "@/lib/domain/status"
import { opsJobKinds, opsJobStatuses } from "@/services/admin/options"
import { enqueueOpsJob } from "@/services/queue/jobs"
import type { QueueJobType } from "@/services/queue/types"

const jobSchema = z.object({
  businessId: z.string().trim().optional().default(""),
  name: z.string().trim().min(1, "Please enter a job name.").max(160),
  kind: z.enum(opsJobKinds).optional().default("MANUAL"),
  status: z.enum(opsJobStatuses).optional().default("PLANNED"),
  source: z.string().trim().max(80).optional().default("ADMIN"),
  details: z.string().trim().max(1600).optional().default(""),
  scheduledFor: z.string().trim().optional().default(""),
})

const adminQueueableKinds = new Set<string>([
  "WEBSITE_AUDIT",
  "AI_GROWTH_PLAN",
  "OWNER_EMAIL_SUMMARY",
])

export async function POST(req: Request) {
  const guard = guardAdminMutation(req, "job-runs")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const body = await req.json().catch(() => ({}))
  const result = jobSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const scheduledFor = parseOptionalAdminDate(result.data.scheduledFor)

  if (scheduledFor === undefined) {
    return Response.json(
      { error: "Please enter a valid scheduled date." },
      { status: 400 }
    )
  }

  try {
    if (
      result.data.status === opsJobStatusValues.queued &&
      adminQueueableKinds.has(result.data.kind)
    ) {
      if (!result.data.businessId) {
        return Response.json(
          { error: "Select a client before queueing this automation job." },
          { status: 400 }
        )
      }

      const { jobRun } = await enqueueOpsJob({
        type: result.data.kind as QueueJobType,
        name: result.data.name,
        businessId: result.data.businessId,
        source: "ADMIN",
        details: result.data.details,
        payload: {
          businessId: result.data.businessId,
        },
        scheduledFor,
        delayMs: scheduledFor
          ? Math.max(0, scheduledFor.getTime() - Date.now())
          : undefined,
      })

      logAdminAction("job.queued", {
        adminEmail: admin.session.user.email,
        jobId: jobRun.id,
        businessId: jobRun.businessId,
      })

      return Response.json({ job: jobRun }, { status: 201 })
    }

    const job = await createOpsJobRun({
      ...result.data,
      businessId: result.data.businessId || null,
      scheduledFor,
    })

    logAdminAction("job.created", {
      adminEmail: admin.session.user.email,
      jobId: job.id,
      businessId: job.businessId,
    })

    return Response.json({ job }, { status: 201 })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "job.create",
      adminEmail: admin.session.user.email,
    })
  }
}
