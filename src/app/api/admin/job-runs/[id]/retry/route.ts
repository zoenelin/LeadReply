import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import { retryOpsJobRun } from "@/services/queue/jobs"

export async function POST(
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

  try {
    const job = await retryOpsJobRun(id)

    logAdminAction("job.retry", {
      adminEmail: admin.session.user.email,
      jobId: job.id,
    })

    return Response.json({ job })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "job.retry",
      adminEmail: admin.session.user.email,
      jobId: id,
    })
  }
}
