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

async function findBusinessAvailabilityWindow(id: string, businessId: string) {
  return prisma.availabilityWindow.findFirst({
    where: {
      id,
      businessId,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAppointments", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingWindow = await findBusinessAvailabilityWindow(
    id,
    auth.access.businessId
  )

  if (!existingWindow) {
    return Response.json(
      { error: "Availability window not found." },
      { status: 404 }
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

    const availabilityWindow = await prisma.availabilityWindow.update({
      where: {
        id,
      },
      data: result.data,
    })

    return Response.json({ availabilityWindow })
  } catch {
    return Response.json(
      { error: "Something went wrong updating availability." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(_req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAppointments", _req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingWindow = await findBusinessAvailabilityWindow(
    id,
    auth.access.businessId
  )

  if (!existingWindow) {
    return Response.json(
      { error: "Availability window not found." },
      { status: 404 }
    )
  }

  try {
    await prisma.availabilityWindow.delete({
      where: {
        id,
      },
    })

    return Response.json({ message: "Availability window deleted." })
  } catch {
    return Response.json(
      { error: "Something went wrong deleting availability." },
      { status: 500 }
    )
  }
}
