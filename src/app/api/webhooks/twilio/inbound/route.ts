import {
  isOptInKeyword,
  isOptOutKeyword,
  recordSmsOptIn,
  recordSmsOptOut,
} from "@/lib/integrations/sms-compliance"
import { verifyTwilioSignature } from "@/lib/integrations/twilio"
import { handleInboundTwilioSms } from "@/services/communications/inbound-sms"
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

function twiml(message = "") {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${
      message ? `<Message>${escapeXml(message)}</Message>` : ""
    }</Response>`,
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
    logger.warn("webhook.twilio_inbound.invalid_signature", {
      requestId,
      from: fields.From,
      messageSid: fields.MessageSid,
    })

    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  const from = fields.From ?? ""
  const body = fields.Body ?? ""

  if (!from) {
    return twiml("Message received.")
  }

  if (isOptOutKeyword(body)) {
    await recordSmsOptOut({ phone: from })
    logger.info("webhook.twilio_inbound.opt_out", {
      requestId,
      from,
    })

    return twiml("You have been opted out of LeadReply messages. Reply START to opt back in.")
  }

  if (isOptInKeyword(body)) {
    await recordSmsOptIn({ phone: from })
    logger.info("webhook.twilio_inbound.opt_in", {
      requestId,
      from,
    })

    return twiml("You have been opted back in to LeadReply messages.")
  }

  try {
    const result = await handleInboundTwilioSms({
      fields,
      requestId,
    })

    logger.info("webhook.twilio_inbound.received", {
      requestId,
      from,
      messageSid: fields.MessageSid,
      matched: result.matched,
      duplicate: result.duplicate,
      queuedReply: result.queuedReply,
      smsMessageId: result.smsMessage.id,
    })

    return twiml(result.responseMessage)
  } catch (error) {
    captureException(error, {
      requestId,
      source: "webhook.twilio_inbound",
      from,
      messageSid: fields.MessageSid,
    })

    return twiml(
      "Thanks, your message was received. The team will follow up soon."
    )
  }
}
