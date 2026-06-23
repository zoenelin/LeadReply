import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { communicationStatuses } from "@/lib/domain/status"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { isPhoneOptedOut } from "@/lib/integrations/sms-compliance"
import { sendTrackedSms } from "@/services/communications/send-tracked-sms"

const followUpStepStatuses = [
  communicationStatuses.draft,
  communicationStatuses.sent,
  communicationStatuses.skipped,
] as const

const followUpStepUpdateSchema = z.object({
  status: z.enum(followUpStepStatuses),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingStep = await prisma.followUpStep.findFirst({
    where: {
      id,
      businessId: auth.access.businessId,
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
      status === communicationStatuses.sent &&
      existingStep.status !== communicationStatuses.sent &&
      existingStep.channel === "TEXT"
    const optedOut = shouldSendSms
      ? await isPhoneOptedOut(
          existingStep.lead.customerPhone,
          existingStep.businessId
        )
      : false
    const delivery = shouldSendSms
      ? optedOut
        ? {
            ok: false as const,
            provider: "TWILIO" as const,
            reason: "This phone number has opted out of SMS messages.",
          }
        : await sendTrackedSms({
            to: existingStep.lead.customerPhone,
            body: existingStep.message,
            businessId: existingStep.businessId,
            purpose: "FOLLOW_UP_STEP",
          })
      : null
    const followUpStep = await prisma.followUpStep.update({
      where: {
        id,
      },
      data: {
        status,
        sentAt:
          status === communicationStatuses.sent
            ? existingStep.sentAt ?? new Date()
            : null,
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
