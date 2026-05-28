import { env } from "@/lib/env"
import { getAppBaseUrl, isConfigured } from "@/lib/integration-status"

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
