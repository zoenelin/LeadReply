import { prisma } from "@/lib/data/prisma"
import { verifyTwilioSignature } from "@/lib/integrations/twilio"
import { updateSmsMessageFromTwilioStatus } from "@/services/communications/sms-messages"
import { logger } from "@/services/observability/logger"

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)])
  )
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const fields = formDataToRecord(formData)
  const requestId = req.headers.get("x-request-id") || ""

  if (!verifyTwilioSignature({ req, fields })) {
    logger.warn("webhook.twilio_status.invalid_signature", {
      requestId,
      messageSid: fields.MessageSid,
    })

    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  const messageSid = fields.MessageSid ?? ""
  const messageStatus = fields.MessageStatus ?? ""
  const errorCode = fields.ErrorCode ?? ""
  const errorMessage = fields.ErrorMessage ?? ""

  if (!messageSid) {
    return Response.json({ received: true })
  }

  const failed = ["failed", "undelivered"].includes(messageStatus)
  const deliveryError = failed
    ? errorMessage || errorCode || "Twilio reported delivery failure."
    : ""

  await Promise.all([
    updateSmsMessageFromTwilioStatus({
      messageSid,
      messageStatus,
      errorCode,
      errorMessage,
      fields,
    }),
    prisma.followUpStep.updateMany({
      where: {
        providerMessageId: messageSid,
      },
      data: {
        deliveryError,
      },
    }),
    prisma.reviewRequest.updateMany({
      where: {
        providerMessageId: messageSid,
      },
      data: {
        deliveryError,
      },
    }),
  ])

  logger.info("webhook.twilio_status.received", {
    requestId,
    messageSid,
    messageStatus,
    failed,
  })

  return Response.json({ received: true })
}
