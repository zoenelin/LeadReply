import { buildOwnerSummaryEmail, sendEmail } from "@/lib/integrations/email"
import { prisma } from "@/lib/data/prisma"

export async function runOwnerEmailSummaryJob({
  businessId,
}: {
  businessId: string
}) {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    include: {
      user: true,
    },
  })

  if (!business) {
    throw new Error("Business not found for owner email summary.")
  }

  if (!business.emailSummaryEnabled) {
    return {
      skipped: true,
      reason: "Owner email summaries are disabled for this business.",
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const [leadCount, missedCallCount, revenue, followUpCount] = await Promise.all([
    prisma.lead.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.missedCall.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.lead.aggregate({
      where: {
        businessId: business.id,
      },
      _sum: {
        capturedValueCents: true,
      },
    }),
    prisma.lead.count({
      where: {
        businessId: business.id,
        followUpAt: {
          lte: tomorrow,
        },
        followUpCompletedAt: null,
      },
    }),
  ])
  const email = buildOwnerSummaryEmail({
    businessName: business.name,
    leadCount,
    missedCallCount,
    revenueCents: revenue._sum.capturedValueCents ?? 0,
    followUpCount,
  })
  const result = await sendEmail({
    to: business.user.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    businessId: business.id,
    userId: business.userId,
  })

  if (!result.ok) {
    throw new Error(result.reason)
  }

  return {
    provider: result.provider,
    messageId: result.messageId,
    to: business.user.email,
  }
}
