import {
  isOptInKeyword,
  isOptOutKeyword,
  recordSmsOptIn,
  recordSmsOptOut,
} from "@/lib/sms-compliance"
import { verifyTwilioSignature } from "@/lib/twilio"

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)])
  )
}

function twiml(message: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
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

  if (!verifyTwilioSignature({ req, fields })) {
    return Response.json({ error: "Invalid signature." }, { status: 400 })
  }

  const from = fields.From ?? ""
  const body = fields.Body ?? ""

  if (!from) {
    return twiml("Message received.")
  }

  if (isOptOutKeyword(body)) {
    await recordSmsOptOut({ phone: from })

    return twiml("You have been opted out of LeadReply messages. Reply START to opt back in.")
  }

  if (isOptInKeyword(body)) {
    await recordSmsOptIn({ phone: from })

    return twiml("You have been opted back in to LeadReply messages.")
  }

  return twiml("Thanks, your message was received.")
}
