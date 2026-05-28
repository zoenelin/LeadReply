import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Please enter a start time."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Please enter an end time."),
  minimumNoticeHours: z.coerce.number().int().min(0).max(168),
  active: z.boolean(),
})

async function findUserAvailabilityWindow(id: string, userId: string) {
  return prisma.availabilityWindow.findFirst({
    where: {
      id,
      business: {
        userId,
      },
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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existingWindow = await findUserAvailabilityWindow(id, session.user.id)

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

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existingWindow = await findUserAvailabilityWindow(id, session.user.id)

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
