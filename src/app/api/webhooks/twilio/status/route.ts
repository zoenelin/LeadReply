import { prisma } from "@/lib/prisma"
import { verifyTwilioSignature } from "@/lib/twilio"

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)])
  )
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const fields = formDataToRecord(formData)

  if (!verifyTwilioSignature({ req, fields })) {
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

  return Response.json({ received: true })
}
