import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "@/lib/config/env"
import {
  getAppBaseUrl,
  getStripePriceId,
  isConfigured,
} from "@/lib/config/integration-status"

type CheckoutInput = {
  plan: string
  businessId: string
  customerEmail: string
}

type PortalInput = {
  customerId: string
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

export async function createStripePortalSession({ customerId }: PortalInput) {
  if (!isConfigured(env.STRIPE_SECRET_KEY)) {
    return {
      ok: false as const,
      reason: "Stripe is not configured yet.",
    }
  }

  if (!customerId.trim()) {
    return {
      ok: false as const,
      reason: "This business does not have a Stripe customer yet.",
    }
  }

  const baseUrl = getAppBaseUrl()
  const body = new URLSearchParams({
    customer: customerId,
    return_url: `${baseUrl}/settings/billing`,
  })

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
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
          : "Stripe could not open the customer portal.",
    }
  }

  return {
    ok: true as const,
    url: typeof data.url === "string" ? data.url : "",
  }
}

function parseStripeSignature(signatureHeader: string) {
  return signatureHeader.split(",").reduce(
    (parsed, part) => {
      const [key, value] = part.split("=")

      if (key === "t" && value) {
        parsed.timestamp = value
      }

      if (key === "v1" && value) {
        parsed.signatures.push(value)
      }

      return parsed
    },
    {
      signatures: [] as string[],
      timestamp: "",
    }
  )
}

function signaturesMatch(expectedSignature: string, computed: string) {
  const expectedBuffer = Buffer.from(expectedSignature, "hex")
  const computedBuffer = Buffer.from(computed, "hex")

  if (expectedBuffer.length !== computedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, computedBuffer)
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
  const timestamp = parsed.timestamp
  const timestampSeconds = Number(timestamp)

  if (
    !timestamp ||
    !Number.isFinite(timestampSeconds) ||
    parsed.signatures.length === 0
  ) {
    return false
  }

  const toleranceSeconds = 5 * 60
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return false
  }

  const signedPayload = `${timestamp}.${payload}`
  const computed = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET?.trim() ?? "")
    .update(signedPayload)
    .digest("hex")

  return parsed.signatures.some((signature) => signaturesMatch(signature, computed))
}
