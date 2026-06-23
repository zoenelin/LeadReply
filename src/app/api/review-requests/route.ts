import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { buildReviewRequestMessage } from "@/lib/domain/review-message"
import { communicationStatuses } from "@/lib/domain/status"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { isPhoneOptedOut } from "@/lib/integrations/sms-compliance"
import { sendTrackedSms } from "@/services/communications/send-tracked-sms"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const reviewRequestSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  message: z.string().trim().optional().default(""),
  markSent: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageReviews", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const body = await req.json()
    const result = reviewRequestSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: result.data.leadId,
        businessId: auth.access.businessId,
      },
      include: {
        business: true,
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found." }, { status: 404 })
    }

    const message = buildReviewRequestMessage({
      business: lead.business,
      message: result.data.message,
    })
    const optedOut = result.data.markSent
      ? await isPhoneOptedOut(lead.customerPhone, lead.businessId)
      : false
    const delivery = result.data.markSent
      ? optedOut
        ? {
            ok: false as const,
            provider: "TWILIO" as const,
            reason: "This phone number has opted out of SMS messages.",
          }
        : await sendTrackedSms({
            to: lead.customerPhone,
            body: message,
            businessId: lead.businessId,
            purpose: "REVIEW_REQUEST",
          })
      : null

    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        businessId: lead.businessId,
        leadId: lead.id,
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        message,
        status: result.data.markSent
          ? communicationStatuses.sent
          : communicationStatuses.draft,
        sentAt: result.data.markSent ? new Date() : null,
        deliveryProvider: delivery?.ok ? delivery.provider : "",
        providerMessageId: delivery?.ok ? delivery.messageId : "",
        deliveryError: delivery && !delivery.ok ? delivery.reason : "",
      },
    })

    return Response.json(
      {
        reviewRequest,
        deliveryMessage: delivery
          ? delivery.ok
            ? "Review request sent by SMS."
            : delivery.reason
          : "Review request saved as a draft.",
      },
      { status: 201 }
    )
  } catch {
    return Response.json(
      { error: "Something went wrong creating the review request." },
      { status: 500 }
    )
  }
}
