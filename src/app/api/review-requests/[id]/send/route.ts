import { prisma } from "@/lib/data/prisma"
import { buildReviewRequestMessage } from "@/lib/domain/review-message"
import { communicationStatuses } from "@/lib/domain/status"
import { isPhoneOptedOut } from "@/lib/integrations/sms-compliance"
import { sendTrackedSms } from "@/services/communications/send-tracked-sms"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageReviews", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingRequest = await prisma.reviewRequest.findFirst({
    where: {
      id,
      businessId: auth.access.businessId,
    },
    include: {
      business: true,
    },
  })

  if (!existingRequest) {
    return Response.json({ error: "Review request not found." }, { status: 404 })
  }

  if (existingRequest.status === communicationStatuses.received) {
    return Response.json(
      { error: "This customer is already marked as having left a review." },
      { status: 400 }
    )
  }

  if (existingRequest.status === communicationStatuses.sent) {
    return Response.json({
      reviewRequest: existingRequest,
      deliveryMessage: "Review request was already sent.",
    })
  }

  try {
    const message = buildReviewRequestMessage({
      business: existingRequest.business,
      message: existingRequest.message,
    })
    const optedOut = await isPhoneOptedOut(
      existingRequest.customerPhone,
      existingRequest.businessId
    )
    const delivery = optedOut
      ? {
          ok: false as const,
          provider: "TWILIO" as const,
          reason: "This phone number has opted out of SMS messages.",
        }
      : await sendTrackedSms({
          to: existingRequest.customerPhone,
          body: message,
          businessId: existingRequest.businessId,
          purpose: "REVIEW_REQUEST",
        })

    const reviewRequest = await prisma.reviewRequest.update({
      where: {
        id,
      },
      data: {
        message,
        status: communicationStatuses.sent,
        sentAt: existingRequest.sentAt ?? new Date(),
        deliveryProvider: delivery.ok ? delivery.provider : "",
        providerMessageId: delivery.ok ? delivery.messageId : "",
        deliveryError: delivery.ok ? "" : delivery.reason,
      },
    })

    return Response.json({
      reviewRequest,
      deliveryMessage: delivery.ok
        ? "Review request sent by SMS."
        : delivery.reason,
    })
  } catch {
    return Response.json(
      { error: "Something went wrong sending the review request." },
      { status: 500 }
    )
  }
}
