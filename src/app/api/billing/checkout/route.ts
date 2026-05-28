import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { planLabels } from "@/lib/business-options"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"
import { createStripeCheckoutSession } from "@/lib/stripe"

const planValues = Object.keys(planLabels) as [string, ...string[]]

const checkoutSchema = z.object({
  selectedPlan: z.enum(planValues),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = checkoutSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid plan." },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: true,
      },
    })

    if (!business) {
      return Response.json({ error: "Business not found." }, { status: 404 })
    }

    await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        selectedPlan: result.data.selectedPlan,
        billingStatus: "STRIPE_CHECKOUT_REQUESTED",
      },
    })

    const checkout = await createStripeCheckoutSession({
      plan: result.data.selectedPlan,
      businessId: business.id,
      customerEmail: business.user.email,
    })

    if (!checkout.ok) {
      await prisma.business.update({
        where: {
          id: business.id,
        },
        data: {
          billingStatus: "STRIPE_SETUP_REQUIRED",
        },
      })

      return Response.json({ error: checkout.reason }, { status: 400 })
    }

    return Response.json({
      checkoutUrl: checkout.url,
      sessionId: checkout.sessionId,
    })
  } catch {
    return Response.json(
      { error: "Something went wrong starting checkout." },
      { status: 500 }
    )
  }
}
