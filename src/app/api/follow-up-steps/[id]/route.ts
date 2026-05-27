import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"

const followUpStepUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "SKIPPED"]),
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
  const existingStep = await prisma.followUpStep.findFirst({
    where: {
      id,
      business: {
        userId: session.user.id,
      },
    },
  })

  if (!existingStep) {
    return Response.json({ error: "Follow-up step not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = followUpStepUpdateSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const { status } = result.data
    const followUpStep = await prisma.followUpStep.update({
      where: {
        id,
      },
      data: {
        status,
        sentAt: status === "SENT" ? existingStep.sentAt ?? new Date() : null,
      },
    })

    return Response.json({ followUpStep })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the follow-up step." },
      { status: 500 }
    )
  }
}
