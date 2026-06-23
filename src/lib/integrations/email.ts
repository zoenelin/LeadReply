import { env } from "@/lib/config/env"
import { getAppBaseUrl, isConfigured } from "@/lib/config/integration-status"
import { prisma } from "@/lib/data/prisma"

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
  businessId?: string
  userId?: string
}

export type EmailResult =
  | {
      ok: true
      provider: "RESEND"
      messageId: string
    }
  | {
      ok: false
      provider: "RESEND"
      reason: string
    }

export function isEmailConfigured() {
  return isConfigured(env.RESEND_API_KEY) && isConfigured(env.EMAIL_FROM)
}

export function getSupportEmail() {
  return env.SUPPORT_EMAIL?.trim() || env.EMAIL_FROM?.trim() || ""
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  businessId,
  userId,
}: SendEmailInput): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        status: "SETUP_REQUIRED",
        provider: "RESEND",
        error: "Resend is not configured.",
        businessId,
        userId,
      },
    })

    return {
      ok: false,
      provider: "RESEND",
      reason: "Production email is not configured yet.",
    }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY?.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM?.trim(),
      to,
      subject,
      html,
      text,
    }),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const reason =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Resend rejected the email."

    await prisma.emailLog.create({
      data: {
        to,
        subject,
        status: "FAILED",
        provider: "RESEND",
        error: reason,
        businessId,
        userId,
      },
    })

    return {
      ok: false,
      provider: "RESEND",
      reason,
    }
  }

  const messageId = typeof data.id === "string" ? data.id : ""

  await prisma.emailLog.create({
    data: {
      to,
      subject,
      status: "SENT",
      provider: "RESEND",
      providerMessageId: messageId,
      businessId,
      userId,
    },
  })

  return {
    ok: true,
    provider: "RESEND",
    messageId,
  }
}

export function buildPasswordResetEmail({
  resetUrl,
}: {
  resetUrl: string
}) {
  return {
    subject: "Reset your LeadReply password",
    text: `Reset your LeadReply password here: ${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: `<p>Reset your LeadReply password here:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
  }
}

export function buildOwnerSummaryEmail({
  businessName,
  leadCount,
  missedCallCount,
  revenueCents,
  followUpCount,
}: {
  businessName: string
  leadCount: number
  missedCallCount: number
  revenueCents: number
  followUpCount: number
}) {
  const revenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(revenueCents / 100)
  const dashboardUrl = `${getAppBaseUrl()}/dashboard`

  return {
    subject: `${businessName} LeadReply weekly summary`,
    text: [
      `${businessName} weekly LeadReply summary`,
      "",
      `Leads tracked: ${leadCount}`,
      `Missed calls: ${missedCallCount}`,
      `Captured revenue: ${revenue}`,
      `Follow-ups due: ${followUpCount}`,
      "",
      `Open dashboard: ${dashboardUrl}`,
    ].join("\n"),
    html: [
      `<h1>${businessName} weekly LeadReply summary</h1>`,
      "<ul>",
      `<li><strong>Leads tracked:</strong> ${leadCount}</li>`,
      `<li><strong>Missed calls:</strong> ${missedCallCount}</li>`,
      `<li><strong>Captured revenue:</strong> ${revenue}</li>`,
      `<li><strong>Follow-ups due:</strong> ${followUpCount}</li>`,
      "</ul>",
      `<p><a href="${dashboardUrl}">Open dashboard</a></p>`,
    ].join(""),
  }
}
