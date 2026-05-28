import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "@/lib/env"
import {
  getAppBaseUrl,
  getStripePriceId,
  isConfigured,
} from "@/lib/integration-status"

type CheckoutInput = {
  plan: string
  businessId: string
  customerEmail: string
}

export function isStripeConfiguredForPlan(plan: string) {
  return isConfigured(env.STRIPE_SECRET_KEY) && isConfigured(getStripePriceId(plan))
}

export async function createStripeCheckoutSession({
  plan,
  businessId,
  customerEmail,
}: CheckoutInput) {
  const priceId = getStripePriceId(plan)

  if (!isStripeConfiguredForPlan(plan)) {
    return {
      ok: false as const,
      reason: "Stripe is not configured for this plan yet.",
    }
  }

  const baseUrl = getAppBaseUrl()
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    customer_email: customerEmail,
    client_reference_id: businessId,
    success_url: `${baseUrl}/settings/billing?checkout=success`,
    cancel_url: `${baseUrl}/settings/billing?checkout=cancelled`,
    "metadata[businessId]": businessId,
    "metadata[selectedPlan]": plan,
    "subscription_data[metadata][businessId]": businessId,
    "subscription_data[metadata][selectedPlan]": plan,
  })

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY?.trim()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return {
      ok: false as const,
      reason:
        typeof data.error?.message === "string"
          ? data.error.message
          : "Stripe could not create the checkout session.",
    }
  }

  return {
    ok: true as const,
    sessionId: typeof data.id === "string" ? data.id : "",
    url: typeof data.url === "string" ? data.url : "",
  }
}

function parseStripeSignature(signatureHeader: string) {
  return Object.fromEntries(
    signatureHeader.split(",").flatMap((part) => {
      const [key, value] = part.split("=")

      return key && value ? [[key, value]] : []
    })
  )
}

export function verifyStripeSignature({
  payload,
  signatureHeader,
}: {
  payload: string
  signatureHeader: string | null
}) {
  if (!isConfigured(env.STRIPE_WEBHOOK_SECRET)) {
    return false
  }

  if (!signatureHeader) {
    return false
  }

  const parsed = parseStripeSignature(signatureHeader)
  const timestamp = parsed.t
  const expectedSignature = parsed.v1

  if (!timestamp || !expectedSignature) {
    return false
  }

  const signedPayload = `${timestamp}.${payload}`
  const computed = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET?.trim() ?? "")
    .update(signedPayload)
    .digest("hex")
  const expectedBuffer = Buffer.from(expectedSignature, "hex")
  const computedBuffer = Buffer.from(computed, "hex")

  if (expectedBuffer.length !== computedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, computedBuffer)
}
