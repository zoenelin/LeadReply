import { z } from "zod"
import { planLabels } from "@/lib/domain/business-options"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { createStripeCheckoutSession } from "@/lib/integrations/stripe"
import { logSecurityEvent } from "@/services/security/security-events"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"

const planValues = Object.keys(planLabels) as [string, ...string[]]

const checkoutSchema = z.object({
  selectedPlan: z.enum(planValues),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
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
        id: auth.access.businessId,
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

    await logSecurityEvent({
      req,
      type: "BILLING_CHECKOUT_REQUESTED",
      actorEmail: business.user.email,
      userId: auth.session.user.id,
      businessId: business.id,
      summary: "Stripe checkout was requested.",
      metadata: {
        selectedPlan: result.data.selectedPlan,
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

      await logSecurityEvent({
        req,
        type: "BILLING_CHECKOUT_BLOCKED",
        outcome: "BLOCKED",
        actorEmail: business.user.email,
        userId: auth.session.user.id,
        businessId: business.id,
        summary: "Stripe checkout could not be created.",
        metadata: {
          selectedPlan: result.data.selectedPlan,
          reason: checkout.reason,
        },
      })

      return Response.json({ error: checkout.reason }, { status: 400 })
    }

    await logSecurityEvent({
      req,
      type: "BILLING_CHECKOUT_CREATED",
      actorEmail: business.user.email,
      userId: auth.session.user.id,
      businessId: business.id,
      summary: "Stripe checkout session was created.",
      metadata: {
        selectedPlan: result.data.selectedPlan,
      },
    })

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
