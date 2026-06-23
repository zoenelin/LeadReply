import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "@/lib/config/env"
import { getAppBaseUrl, isConfigured } from "@/lib/config/integration-status"

type SendSmsInput = {
  to: string
  body: string
  statusCallbackPath?: string
}

export type SmsResult =
  | {
      ok: true
      provider: "TWILIO"
      messageId: string
      status: string
    }
  | {
      ok: false
      provider: "TWILIO"
      reason: string
      status?: string
    }

export function isTwilioConfigured() {
  return (
    isConfigured(env.TWILIO_ACCOUNT_SID) &&
    isConfigured(env.TWILIO_AUTH_TOKEN) &&
    (isConfigured(env.TWILIO_PHONE_NUMBER) ||
      isConfigured(env.TWILIO_MESSAGING_SERVICE_SID))
  )
}

export function verifyTwilioSignature({
  req,
  fields,
}: {
  req: Request
  fields: Record<string, string>
}) {
  if (!isConfigured(env.TWILIO_AUTH_TOKEN)) {
    return false
  }

  const signature = req.headers.get("x-twilio-signature")

  if (!signature) {
    return false
  }

  const requestUrl = new URL(req.url)
  const verificationUrl = `${getAppBaseUrl()}${requestUrl.pathname}${requestUrl.search}`
  const signedPayload = Object.keys(fields)
    .sort()
    .reduce((payload, key) => `${payload}${key}${fields[key]}`, verificationUrl)
  const computed = createHmac("sha1", env.TWILIO_AUTH_TOKEN?.trim() ?? "")
    .update(signedPayload)
    .digest("base64")
  const expectedBuffer = Buffer.from(signature)
  const computedBuffer = Buffer.from(computed)

  if (expectedBuffer.length !== computedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, computedBuffer)
}

export async function sendSms({
  to,
  body,
  statusCallbackPath,
}: SendSmsInput): Promise<SmsResult> {
  if (!isTwilioConfigured()) {
    return {
      ok: false,
      provider: "TWILIO",
      reason: "Twilio is not configured yet.",
    }
  }

  const accountSid = env.TWILIO_ACCOUNT_SID?.trim() ?? ""
  const authToken = env.TWILIO_AUTH_TOKEN?.trim() ?? ""
  const requestBody = new URLSearchParams({
    To: to,
    Body: body.slice(0, 1600),
  })

  if (isConfigured(env.TWILIO_MESSAGING_SERVICE_SID)) {
    requestBody.set(
      "MessagingServiceSid",
      env.TWILIO_MESSAGING_SERVICE_SID?.trim() ?? ""
    )
  } else {
    requestBody.set("From", env.TWILIO_PHONE_NUMBER?.trim() ?? "")
  }

  if (statusCallbackPath) {
    requestBody.set("StatusCallback", `${getAppBaseUrl()}${statusCallbackPath}`)
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody.toString(),
    }
  )
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return {
      ok: false,
      provider: "TWILIO",
      reason:
        typeof data.message === "string"
          ? data.message
          : "Twilio rejected the message.",
      status: typeof data.status === "string" ? data.status : undefined,
    }
  }

  return {
    ok: true,
    provider: "TWILIO",
    messageId: typeof data.sid === "string" ? data.sid : "",
    status: typeof data.status === "string" ? data.status : "queued",
  }
}
