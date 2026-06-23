import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import {
  createAdminMarketingCalendarItem,
  parseOptionalAdminDate,
} from "@/services/admin/operations"
import {
  adminContentStatuses,
  adminMarketingChannels,
} from "@/services/admin/options"

const marketingCalendarSchema = z.object({
  businessId: z.string().trim().min(1, "Please select a client."),
  title: z.string().trim().min(1, "Please enter a content title.").max(140),
  channel: z.enum(adminMarketingChannels).optional().default("FACEBOOK"),
  campaignGoal: z.string().trim().max(160).optional().default(""),
  contentTheme: z.string().trim().max(160).optional().default(""),
  offer: z.string().trim().max(220).optional().default(""),
  status: z.enum(adminContentStatuses).optional().default("DRAFT"),
  scheduledFor: z.string().trim().optional().default(""),
  notes: z.string().trim().max(1200).optional().default(""),
})

export async function POST(req: Request) {
  const guard = guardAdminMutation(req, "marketing-calendar")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const body = await req.json().catch(() => ({}))
  const result = marketingCalendarSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const item = await createAdminMarketingCalendarItem({
      ...result.data,
      scheduledFor: parseOptionalAdminDate(result.data.scheduledFor),
    })

    logAdminAction("marketing_calendar.created", {
      adminEmail: admin.session.user.email,
      itemId: item.id,
      businessId: item.businessId,
    })

    return Response.json({ item }, { status: 201 })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "marketing_calendar.create",
      adminEmail: admin.session.user.email,
    })
  }
}
