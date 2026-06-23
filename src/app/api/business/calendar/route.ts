import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const calendarSchema = z.object({
  calendarProvider: z
    .enum(["", "GOOGLE_CALENDAR", "APPLE_CALENDAR", "OUTLOOK", "OTHER"])
    .optional()
    .default(""),
  calendarBookingUrl: z.string().trim().optional().default(""),
  calendarSyncNotes: z.string().trim().max(1000).optional().default(""),
  autoSchedulingEnabled: z.boolean().optional().default(false),
})

export async function PUT(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAppointments", req)

  if ("response" in auth) {
    return auth.response
  }

  const body = await req.json().catch(() => ({}))
  const result = calendarSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const business = await prisma.business.update({
    where: {
      id: auth.access.businessId,
    },
    data: result.data,
  })

  return Response.json({ business })
}
