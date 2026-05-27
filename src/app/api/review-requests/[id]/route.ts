import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"

const reviewRequestUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "RECEIVED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existingRequest = await prisma.reviewRequest.findFirst({
    where: {
      id,
      business: {
        userId: session.user.id,
      },
    },
  })

  if (!existingRequest) {
    return Response.json({ error: "Review request not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = reviewRequestUpdateSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const now = new Date()
    const { status } = result.data
    const reviewRequest = await prisma.reviewRequest.update({
      where: {
        id,
      },
      data: {
        status,
        sentAt:
          status === "DRAFT" ? null : existingRequest.sentAt ?? now,
        receivedAt:
          status === "RECEIVED"
            ? existingRequest.receivedAt ?? now
            : null,
      },
    })

    return Response.json({ reviewRequest })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the review request." },
      { status: 500 }
    )
  }
}
