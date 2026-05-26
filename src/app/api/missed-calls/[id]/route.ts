import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { z } from "zod"

const missedCallSchema = z.object({
  status: z.enum(["NEW", "REPLIED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = missedCallSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const { id } = await params

    const missedCall = await prisma.missedCall.findFirst({
      where: {
        id,
        business: {
          userId: session.user.id,
        },
      },
    })

    if (!missedCall) {
      return Response.json({ error: "Missed call not found." }, { status: 404 })
    }

    const updatedCall = await prisma.missedCall.update({
      where: {
        id,
      },
      data: {
        status: result.data.status,
        repliedAt: result.data.status === "REPLIED" ? new Date() : null,
      },
    })

    return Response.json({ missedCall: updatedCall })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the missed call." },
      { status: 500 }
    )
  }
}
