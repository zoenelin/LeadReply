import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Please enter a start time."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Please enter an end time."),
  minimumNoticeHours: z.coerce.number().int().min(0).max(168),
  active: z.boolean(),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAppointments", req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
  })

  if (!business) {
    return Response.json(
      { error: "Please finish business setup before adding availability." },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const result = availabilitySchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    if (result.data.startTime >= result.data.endTime) {
      return Response.json(
        { error: "End time must be after start time." },
        { status: 400 }
      )
    }

    const availabilityWindow = await prisma.availabilityWindow.create({
      data: {
        businessId: business.id,
        dayOfWeek: result.data.dayOfWeek,
        startTime: result.data.startTime,
        endTime: result.data.endTime,
        minimumNoticeHours: result.data.minimumNoticeHours,
        active: result.data.active,
      },
    })

    return Response.json({ availabilityWindow }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong saving availability." },
      { status: 500 }
    )
  }
}
