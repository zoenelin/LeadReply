import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  parseOptionalAdminDate,
  updateAdminContentDraft,
} from "@/services/admin/operations"
import { adminContentStatuses } from "@/services/admin/options"

const contentDraftSchema = z.object({
  status: z.enum(adminContentStatuses).optional(),
  scheduledFor: z.string().trim().optional(),
  notes: z.string().trim().max(1600).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardAdminMutation(req, "content-drafts")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = contentDraftSchema.safeParse(body)

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
    const item = await updateAdminContentDraft(id, {
      status: result.data.status,
      notes: result.data.notes,
      ...(result.data.scheduledFor !== undefined ? { scheduledFor } : {}),
    })

    logAdminAction("content_draft.updated", {
      adminEmail: admin.session.user.email,
      contentDraftId: item.id,
      businessId: item.businessId,
    })

    return Response.json({ item })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "content_draft.update",
      adminEmail: admin.session.user.email,
      contentDraftId: id,
    })
  }
}
