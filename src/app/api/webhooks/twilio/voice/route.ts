import { getAppBaseUrl } from "@/lib/config/integration-status"
import { verifyTwilioSignature } from "@/lib/integrations/twilio"
import {
  findPhoneLineForCalledNumber,
  getRouteTargetAt,
} from "@/services/communications/phone-call-routing"
import { recordMissedCallAndStartMissedCallAssistant } from "@/services/communications/missed-call-automation"
import { captureException } from "@/services/observability/error-monitoring"
import { logger } from "@/services/observability/logger"

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)])
  )
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function twiml(body: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    {
      headers: {
        "Content-Type": "text/xml",
      },
    }
  )
}

function dialTargetTwiML({
  phoneLineId,
  routeIndex,
  targetPhone,
  timeout,
}: {
  phoneLineId: string
  routeIndex: number
  targetPhone: string
  timeout: number
}) {
  const statusUrl = new URL("/api/webhooks/twilio/voice/status", getAppBaseUrl())
  statusUrl.searchParams.set("lineId", phoneLineId)
  statusUrl.searchParams.set("routeIndex", String(routeIndex))

  return twiml(
    `<Dial action="${escapeXml(
      statusUrl.toString()
    )}" method="POST" timeout="${timeout}"><Number>${escapeXml(
      targetPhone
    )}</Number></Dial>`
  )
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const fields = formDataToRecord(formData)
  const requestId = req.headers.get("x-request-id") || ""

  if (!verifyTwilioSignature({ req, fields })) {
    logger.warn("webhook.twilio_voice.invalid_signature", {
      requestId,
      from: fields.From,
      to: fields.To,
      callSid: fields.CallSid,
    })

    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  const from = fields.From ?? fields.Caller ?? ""
  const to = fields.To ?? fields.Called ?? ""

  try {
    const phoneLine = await findPhoneLineForCalledNumber(to)

    if (!phoneLine) {
      logger.warn("webhook.twilio_voice.no_phone_line", {
        requestId,
        from,
        to,
        callSid: fields.CallSid,
      })

      return twiml(`<Reject reason="busy" />`)
    }

    const firstTarget = getRouteTargetAt(phoneLine, 0)

    if (!firstTarget) {
      await recordMissedCallAndStartMissedCallAssistant({
        callerName: fields.CallerName,
        callerPhone: from,
        calledPhoneNumber: to,
        businessPhoneLineId: phoneLine.id,
        reason: "Missed call: no routing target is configured.",
        requestId,
      })

      return twiml(
        `<Say>${escapeXml(
          "Thanks for calling. The team has been notified and will text you shortly."
        )}</Say>`
      )
    }

    const timeout = phoneLine.business.selectedPlan === "BASIC" ? 20 : 25

    return dialTargetTwiML({
      phoneLineId: phoneLine.id,
      routeIndex: 0,
      targetPhone: firstTarget.phoneNumber,
      timeout,
    })
  } catch (error) {
    captureException(error, {
      requestId,
      source: "webhook.twilio_voice",
      from,
      to,
      callSid: fields.CallSid,
    })

    return twiml(
      `<Say>${escapeXml(
        "Thanks for calling. The team has been notified and will text you shortly."
      )}</Say>`
    )
  }
}
