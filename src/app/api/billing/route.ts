import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { planLabels } from "@/lib/business-options"
import { prisma } from "@/lib/prisma"

const planValues = Object.keys(planLabels) as [string, ...string[]]

const billingSchema = z.object({
  selectedPlan: z.enum(planValues),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = billingSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid plan." },
        { status: 400 }
      )
    }

    const business = await prisma.business.update({
      where: {
        userId: session.user.id,
      },
      data: {
        selectedPlan: result.data.selectedPlan,
        billingStatus: "MOCK_ACTIVE",
      },
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong updating billing." },
      { status: 500 }
    )
  }
}
