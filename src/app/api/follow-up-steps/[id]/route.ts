import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"
import { isPhoneOptedOut } from "@/lib/sms-compliance"
import { isTwilioConfigured, sendSms } from "@/lib/twilio"

const followUpStepUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "SKIPPED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const existingStep = await prisma.followUpStep.findFirst({
    where: {
      id,
      business: {
        userId: session.user.id,
      },
    },
    include: {
      lead: true,
    },
  })

  if (!existingStep) {
    return Response.json({ error: "Follow-up step not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = followUpStepUpdateSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const { status } = result.data
    const shouldSendSms =
      status === "SENT" &&
      existingStep.status !== "SENT" &&
      existingStep.channel === "TEXT"
    const optedOut = shouldSendSms
      ? await isPhoneOptedOut(existingStep.lead.customerPhone, existingStep.businessId)
      : false
    const delivery = shouldSendSms
      ? optedOut
        ? {
            ok: false as const,
            provider: "TWILIO" as const,
            reason: "This phone number has opted out of SMS messages.",
          }
        : isTwilioConfigured()
          ? await sendSms({
              to: existingStep.lead.customerPhone,
              body: existingStep.message,
              statusCallbackPath: "/api/webhooks/twilio/status",
            })
          : {
              ok: false as const,
              provider: "TWILIO" as const,
              reason:
                "Twilio is not configured; follow-up was marked sent manually.",
            }
      : null
    const followUpStep = await prisma.followUpStep.update({
      where: {
        id,
      },
      data: {
        status,
        sentAt: status === "SENT" ? existingStep.sentAt ?? new Date() : null,
        deliveryProvider: delivery?.ok ? delivery.provider : "",
        providerMessageId: delivery?.ok ? delivery.messageId : "",
        deliveryError: delivery && !delivery.ok ? delivery.reason : "",
      },
    })

    return Response.json({
      followUpStep,
      deliveryMessage: delivery
        ? delivery.ok
          ? "Follow-up text sent."
          : delivery.reason
        : "Follow-up step updated.",
    })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the follow-up step." },
      { status: 500 }
    )
  }
}
