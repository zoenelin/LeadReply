import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import { updateAdminBusinessFields } from "@/services/admin/operations"
import { adminBillingStatuses } from "@/services/admin/options"
import { logSecurityEvent } from "@/services/security/security-events"

const businessUpdateSchema = z.object({
  selectedPlan: z.enum(["BASIC", "GROWTH", "COMPLETE"]).optional(),
  billingStatus: z.enum(adminBillingStatuses).optional(),
  onboardingComplete: z.boolean().optional(),
  contactName: z.string().trim().max(120).optional(),
  contactPhonePrimary: z.string().trim().max(40).optional(),
  contactPhoneSecondary: z.string().trim().max(40).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardAdminMutation(req, "businesses")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = businessUpdateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const business = await updateAdminBusinessFields(id, result.data)

    logAdminAction("business.updated", {
      adminEmail: admin.session.user.email,
      businessId: business.id,
    })

    await logSecurityEvent({
      req,
      type: "ADMIN_BUSINESS_UPDATED",
      actorType: "ADMIN",
      actorEmail: admin.session.user.email,
      businessId: business.id,
      summary: "Admin updated client account fields.",
      metadata: {
        changedFields: Object.keys(result.data),
      },
    })

    return Response.json({ business })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "business.update",
      adminEmail: admin.session.user.email,
      businessId: id,
    })
  }
}
