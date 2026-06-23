import { getAppBaseUrl } from "@/lib/config/integration-status"
import { verifyTwilioSignature } from "@/lib/integrations/twilio"
import {
  findPhoneLineById,
  getRouteTargetAt,
  missedDialStatuses,
  readRouteIndex,
  recordPhoneRoutingAttempt,
  linkRoutingAttemptsToMissedCall,
} from "@/services/communications/phone-call-routing"
import { recordMissedCallAndStartMissedCallAssistant } from "@/services/communications/missed-call-automation"
import { captureException } from "@/services/observability/error-monitoring"
import { logger } from "@/services/observability/logger"

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)])
  )
}

function twiml() {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response />`, {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
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

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Dial action="${escapeXml(
      statusUrl.toString()
    )}" method="POST" timeout="${timeout}"><Number>${escapeXml(
      targetPhone
    )}</Number></Dial></Response>`,
    {
      headers: {
        "Content-Type": "text/xml",
      },
    }
  )
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const fields = formDataToRecord(formData)
  const requestId = req.headers.get("x-request-id") || ""

  if (!verifyTwilioSignature({ req, fields })) {
    logger.warn("webhook.twilio_voice_status.invalid_signature", {
      requestId,
      from: fields.From,
      to: fields.To,
      callSid: fields.CallSid,
      dialCallStatus: fields.DialCallStatus,
    })

    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  const dialStatus = (fields.DialCallStatus || fields.CallStatus || "")
    .trim()
    .toLowerCase()

  try {
    const lineId = new URL(req.url).searchParams.get("lineId") ?? undefined
    const routeIndex = readRouteIndex(req.url)
    const phoneLine = lineId ? await findPhoneLineById(lineId) : null

    if (!phoneLine) {
      logger.warn("webhook.twilio_voice_status.no_phone_line", {
        requestId,
        from: fields.From,
        to: fields.To,
        callSid: fields.CallSid,
        dialCallStatus: dialStatus,
        lineId,
      })

      return twiml()
    }

    const target = getRouteTargetAt(phoneLine, routeIndex)
    await recordPhoneRoutingAttempt({
      fields,
      phoneLine,
      target,
      routeIndex,
      status: dialStatus || "UNKNOWN",
    })

    if (!missedDialStatuses.has(dialStatus)) {
      logger.info("webhook.twilio_voice_status.not_missed", {
        requestId,
        from: fields.From,
        to: fields.To,
        callSid: fields.CallSid,
        dialCallStatus: dialStatus,
        routeIndex,
        routedTo: target?.phoneNumber,
      })

      return twiml()
    }

    const nextRouteIndex = routeIndex + 1
    const nextTarget = getRouteTargetAt(phoneLine, nextRouteIndex)

    if (nextTarget) {
      logger.info("webhook.twilio_voice_status.trying_next_target", {
        requestId,
        from: fields.From,
        to: fields.To,
        callSid: fields.CallSid,
        dialCallStatus: dialStatus,
        routeIndex,
        nextRouteIndex,
        nextTarget: nextTarget.phoneNumber,
      })

      return dialTargetTwiML({
        phoneLineId: phoneLine.id,
        routeIndex: nextRouteIndex,
        targetPhone: nextTarget.phoneNumber,
        timeout: phoneLine.business.selectedPlan === "BASIC" ? 20 : 25,
      })
    }

    const result = await recordMissedCallAndStartMissedCallAssistant({
      callerName: fields.CallerName,
      callerPhone: fields.From ?? fields.Caller ?? "",
      calledPhoneNumber: fields.To ?? fields.Called ?? fields.DialCallTo ?? "",
      routedToPhoneNumber:
        target?.phoneNumber ?? fields.DialCallTo ?? fields.Called ?? "",
      businessPhoneLineId: phoneLine.id,
      reason: `Missed call: ${dialStatus}.`,
      requestId,
    })

    if (result.missedCall) {
      await linkRoutingAttemptsToMissedCall({
        missedCallId: result.missedCall.id,
        providerParentCallSid: fields.CallSid ?? "",
      })
    }

    logger.info("webhook.twilio_voice_status.missed_call_recorded", {
      requestId,
      from: fields.From,
      to: fields.To,
      callSid: fields.CallSid,
      dialCallStatus: dialStatus,
      routeIndex,
      matched: result.matched,
      automationStarted: result.automationStarted,
      alreadyStarted: result.alreadyStarted,
      missedCallId: result.missedCall?.id,
      intakeId: result.intake?.id,
      textJobId: result.textJob?.id,
    })
  } catch (error) {
    captureException(error, {
      requestId,
      source: "webhook.twilio_voice_status",
      from: fields.From,
      to: fields.To,
      callSid: fields.CallSid,
      dialCallStatus: dialStatus,
    })
  }

  return twiml()
}
