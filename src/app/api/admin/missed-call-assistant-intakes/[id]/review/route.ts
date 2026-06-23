import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  serializeMissedCallAssistantReviewError,
  updateMissedCallAssistantAdminReview,
} from "@/services/admin/missed-call-assistant-reviews"
import { logSecurityEvent } from "@/services/security/security-events"
import { missedCallAssistantReviewStatuses } from "@/lib/domain/status"

const missedCallAssistantReviewSchema = z.object({
  status: z.enum([
    missedCallAssistantReviewStatuses.needsReview,
    missedCallAssistantReviewStatuses.changesRequested,
    missedCallAssistantReviewStatuses.approved,
  ]),
  summary: z.string().trim().min(1).max(3000),
  nextAction: z.string().trim().min(1).max(3000),
  notes: z.string().trim().max(3000).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardAdminMutation(req, "missed-call-assistant-intake-review")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = missedCallAssistantReviewSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const intake = await updateMissedCallAssistantAdminReview({
      intakeId: id,
      adminEmail: admin.session.user.email ?? "Admin",
      ...result.data,
    })

    logAdminAction("missed_call_assistant_intake.reviewed", {
      adminEmail: admin.session.user.email,
      intakeId: intake.id,
      reviewStatus: intake.adminReviewStatus,
    })

    await logSecurityEvent({
      req,
      type: "ADMIN_MISSED_CALL_ASSISTANT_REVIEW_UPDATED",
      actorType: "ADMIN",
      actorEmail: admin.session.user.email,
      businessId: intake.businessId,
      summary: "Admin reviewed an LeadReply missed-call assistant intake.",
      metadata: {
        intakeId: intake.id,
        reviewStatus: intake.adminReviewStatus,
      },
    })

    return Response.json({ intake })
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return Response.json(
        { error: serializeMissedCallAssistantReviewError(error) },
        { status: 400 }
      )
    }

    return adminErrorResponse(error, {
      action: "missed_call_assistant_intake.review",
      adminEmail: admin.session.user.email,
      intakeId: id,
    })
  }
}
