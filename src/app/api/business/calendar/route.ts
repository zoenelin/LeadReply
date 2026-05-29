import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
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
      userId: session.user.id,
    },
    data: result.data,
  })

  return Response.json({ business })
}
