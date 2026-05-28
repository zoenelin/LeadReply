import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"
import { isTwilioConfigured, sendSms } from "@/lib/twilio"

const reviewRequestSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  message: z.string().trim().optional().default(""),
  markSent: z.boolean().optional().default(false),
})

function buildReviewMessage(message: string, googleReviewUrl: string) {
  if (!googleReviewUrl.trim()) {
    return message
  }

  if (message.includes(googleReviewUrl)) {
    return message
  }

  return `${message}\n\nReview link: ${googleReviewUrl.trim()}`
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
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
        business: {
          userId: session.user.id,
        },
      },
      include: {
        business: true,
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found." }, { status: 404 })
    }

    const baseMessage =
      result.data.message ||
      `Thanks for choosing ${lead.business.name}. Would you mind leaving us a quick review?`
    const message = buildReviewMessage(baseMessage, lead.business.googleReviewUrl)
    const delivery = result.data.markSent
      ? isTwilioConfigured()
        ? await sendSms({
            to: lead.customerPhone,
            body: message,
          })
        : {
            ok: false as const,
            provider: "TWILIO" as const,
            reason: "Twilio is not configured; request was marked sent manually.",
          }
      : null

    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        businessId: lead.businessId,
        leadId: lead.id,
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        message,
        status: result.data.markSent ? "SENT" : "DRAFT",
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
