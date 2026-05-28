import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { dollarsToCents } from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Please enter a service name."),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  estimateLow: z.string().optional().default(""),
  estimateHigh: z.string().optional().default(""),
  durationMinutes: z.coerce.number().int().min(5).max(1440),
  bookableOnline: z.boolean(),
  ownerConfirmRequired: z.boolean(),
  active: z.boolean(),
})

async function findUserService(id: string, userId: string) {
  return prisma.serviceOffering.findFirst({
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
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existingService = await findUserService(id, session.user.id)

  if (!existingService) {
    return Response.json({ error: "Service not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = serviceSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }
    const estimateLowCents = dollarsToCents(result.data.estimateLow)
    const estimateHighCents = dollarsToCents(result.data.estimateHigh)

    if (
      estimateLowCents > 0 &&
      estimateHighCents > 0 &&
      estimateHighCents < estimateLowCents
    ) {
      return Response.json(
        { error: "High estimate must be greater than the low estimate." },
        { status: 400 }
      )
    }

    const service = await prisma.serviceOffering.update({
      where: {
        id,
      },
      data: {
        name: result.data.name,
        description: result.data.description,
        category: result.data.category,
        estimateLowCents,
        estimateHighCents,
        durationMinutes: result.data.durationMinutes,
        bookableOnline: result.data.bookableOnline,
        ownerConfirmRequired: result.data.ownerConfirmRequired,
        active: result.data.active,
      },
    })

    return Response.json({ service })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the service." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existingService = await findUserService(id, session.user.id)

  if (!existingService) {
    return Response.json({ error: "Service not found." }, { status: 404 })
  }

  try {
    await prisma.serviceOffering.delete({
      where: {
        id,
      },
    })

    return Response.json({ message: "Service deleted." })
  } catch {
    return Response.json(
      { error: "Something went wrong deleting the service." },
      { status: 500 }
    )
  }
}
