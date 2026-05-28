import { env } from "@/lib/env"
import { getSiteUrl } from "@/lib/site"

export type IntegrationKey =
  | "database"
  | "auth"
  | "openai"
  | "twilio"
  | "stripe"
  | "google"
  | "deployment"

export type IntegrationStatus = {
  key: IntegrationKey
  label: string
  configured: boolean
  summary: string
  required: boolean
  missing: string[]
}

export function isConfigured(value: string | undefined | null) {
  return Boolean(value?.trim())
}

function status({
  key,
  label,
  configured,
  summary,
  required,
  missing,
}: IntegrationStatus): IntegrationStatus {
  return {
    key,
    label,
    configured,
    summary,
    required,
    missing,
  }
}

function missingEnv(keys: string[]) {
  return keys.filter((key) => !isConfigured(process.env[key]))
}

export function getAppBaseUrl() {
  return getSiteUrl()
}

export function getStripePriceId(plan: string) {
  if (plan === "GROWTH") {
    return env.STRIPE_PRICE_GROWTH?.trim() ?? ""
  }

  if (plan === "COMPLETE") {
    return env.STRIPE_PRICE_COMPLETE?.trim() ?? ""
  }

  return env.STRIPE_PRICE_BASIC?.trim() ?? ""
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  const twilioMissing = missingEnv([
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
  ])
  const hasTwilioSender =
    isConfigured(env.TWILIO_PHONE_NUMBER) ||
    isConfigured(env.TWILIO_MESSAGING_SERVICE_SID)
  const stripeMissing = missingEnv(["STRIPE_SECRET_KEY"])
  const stripePriceMissing = missingEnv([
    "STRIPE_PRICE_BASIC",
    "STRIPE_PRICE_GROWTH",
    "STRIPE_PRICE_COMPLETE",
  ])
  const googleMissing = missingEnv(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"])

  return [
    status({
      key: "database",
      label: "PostgreSQL",
      configured: isConfigured(env.DATABASE_URL),
      summary: "Stores accounts, businesses, leads, analytics, and settings.",
      required: true,
      missing: missingEnv(["DATABASE_URL"]),
    }),
    status({
      key: "auth",
      label: "Authentication",
      configured: isConfigured(env.NEXTAUTH_SECRET),
      summary: "Protects account access and owner-only CRM data.",
      required: true,
      missing: missingEnv(["NEXTAUTH_SECRET"]),
    }),
    status({
      key: "openai",
      label: "OpenAI concierge",
      configured: isConfigured(env.OPENAI_API_KEY),
      summary:
        "Improves missed-call summaries while preserving scheduling and quote guard rails.",
      required: false,
      missing: missingEnv(["OPENAI_API_KEY"]),
    }),
    status({
      key: "twilio",
      label: "Twilio texting",
      configured: twilioMissing.length === 0 && hasTwilioSender,
      summary: "Sends SMS follow-ups and review requests from LeadReply.",
      required: true,
      missing: [
        ...twilioMissing,
        ...(hasTwilioSender
          ? []
          : ["TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID"]),
      ],
    }),
    status({
      key: "stripe",
      label: "Stripe billing",
      configured: stripeMissing.length === 0 && stripePriceMissing.length === 0,
      summary: "Creates subscription checkout sessions for paid plans.",
      required: true,
      missing: [...stripeMissing, ...stripePriceMissing],
    }),
    status({
      key: "google",
      label: "Google profile",
      configured: googleMissing.length === 0,
      summary:
        "Prepares review/profile integration; business review links can be used now.",
      required: false,
      missing: googleMissing,
    }),
    status({
      key: "deployment",
      label: "Production URL",
      configured: isConfigured(env.APP_BASE_URL) || isConfigured(env.NEXTAUTH_URL),
      summary: "Used for Stripe redirects, webhooks, public forms, and PWA links.",
      required: true,
      missing: missingEnv(["APP_BASE_URL or NEXTAUTH_URL"]),
    }),
  ]
}

export function getLaunchReadinessScore(statuses = getIntegrationStatuses()) {
  const required = statuses.filter((item) => item.required)

  if (required.length === 0) {
    return 0
  }

  const completed = required.filter((item) => item.configured).length

  return Math.round((completed / required.length) * 100)
}
