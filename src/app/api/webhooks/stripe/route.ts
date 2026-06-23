import { prisma } from "@/lib/data/prisma"
import { verifyStripeSignature } from "@/lib/integrations/stripe"
import { captureException } from "@/services/observability/error-monitoring"
import { logger } from "@/services/observability/logger"

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
  const requestId = req.headers.get("x-request-id") || ""

  if (
    !verifyStripeSignature({
      payload,
      signatureHeader: req.headers.get("stripe-signature"),
    })
  ) {
    logger.warn("webhook.stripe.invalid_signature", {
      requestId,
    })

    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  let event: StripeEvent

  try {
    event = JSON.parse(payload) as StripeEvent
  } catch (error) {
    captureException(error, {
      requestId,
      source: "webhook.stripe",
      reason: "invalid_json",
    })

    return Response.json({ error: "Invalid payload." }, { status: 400 })
  }

  const businessId = getBusinessId(event)

  if (!businessId) {
    logger.info("webhook.stripe.ignored", {
      requestId,
      eventType: event.type,
      reason: "missing_business_id",
    })

    return Response.json({ received: true })
  }

  if (event.type === "checkout.session.completed") {
    const result = await prisma.business.updateMany({
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

    logger.info("webhook.stripe.checkout_completed", {
      requestId,
      businessId,
      matchedBusinesses: result.count,
    })
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.paused"
  ) {
    const result = await prisma.business.updateMany({
      where: {
        id: businessId,
      },
      data: {
        billingStatus: "PAUSED",
      },
    })

    logger.info("webhook.stripe.subscription_paused", {
      requestId,
      businessId,
      eventType: event.type,
      matchedBusinesses: result.count,
    })
  }

  return Response.json({ received: true })
}
