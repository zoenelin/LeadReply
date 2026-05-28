import { prisma } from "@/lib/prisma"
import { verifyStripeSignature } from "@/lib/stripe"

type StripeEvent = {
  type?: string
  data?: {
    object?: {
      id?: string
      customer?: string
      subscription?: string
      client_reference_id?: string
      metadata?: {
        businessId?: string
        selectedPlan?: string
      }
    }
  }
}

function getBusinessId(event: StripeEvent) {
  return (
    event.data?.object?.metadata?.businessId ||
    event.data?.object?.client_reference_id ||
    ""
  )
}

function getSelectedPlan(event: StripeEvent) {
  return event.data?.object?.metadata?.selectedPlan || ""
}

export async function POST(req: Request) {
  const payload = await req.text()

  if (
    !verifyStripeSignature({
      payload,
      signatureHeader: req.headers.get("stripe-signature"),
    })
  ) {
    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  const event = JSON.parse(payload) as StripeEvent
  const businessId = getBusinessId(event)

  if (!businessId) {
    return Response.json({ received: true })
  }

  if (event.type === "checkout.session.completed") {
    await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        billingStatus: "ACTIVE",
        selectedPlan: getSelectedPlan(event) || undefined,
        stripeCustomerId: event.data?.object?.customer || "",
        stripeSubscriptionId: event.data?.object?.subscription || "",
      },
    })
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.paused"
  ) {
    await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        billingStatus: "PAUSED",
      },
    })
  }

  return Response.json({ received: true })
}
