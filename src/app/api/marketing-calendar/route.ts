import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const calendarItemSchema = z.object({
  title: z.string().trim().min(1, "Please enter a calendar item title.").max(140),
  channel: z.string().trim().max(80).optional().default(""),
  campaignGoal: z.string().trim().max(160).optional().default(""),
  contentTheme: z.string().trim().max(160).optional().default(""),
  offer: z.string().trim().max(220).optional().default(""),
  status: z
    .enum(["DRAFT", "NEEDS_APPROVAL", "SCHEDULED", "POSTED"])
    .optional()
    .default("DRAFT"),
  scheduledFor: z.string().trim().optional().default(""),
  notes: z.string().trim().max(1200).optional().default(""),
})

function parseOptionalDate(value: string) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMarketing", req)

  if ("response" in auth) {
    return auth.response
  }

  const body = await req.json().catch(() => ({}))
  const result = calendarItemSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const item = await prisma.marketingCalendarItem.create({
    data: {
      businessId: auth.access.businessId,
      title: result.data.title,
      channel: result.data.channel,
      campaignGoal: result.data.campaignGoal,
      contentTheme: result.data.contentTheme,
      offer: result.data.offer,
      status: result.data.status,
      scheduledFor: parseOptionalDate(result.data.scheduledFor),
      notes: result.data.notes,
    },
  })

  return Response.json({ item }, { status: 201 })
}
