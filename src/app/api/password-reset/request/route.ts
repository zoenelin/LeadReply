import { createHash, randomBytes } from "node:crypto"
import { z } from "zod"
import { buildPasswordResetEmail, sendEmail } from "@/lib/email"
import { getAppBaseUrl } from "@/lib/integration-status"
import { prisma } from "@/lib/prisma"
import { checkRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const requestSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, "password-reset-request", {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  const body = await req.json().catch(() => ({}))
  const result = requestSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const email = result.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (user) {
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash: hashToken(token),
        expiresAt,
      },
    })

    const resetUrl = `${getAppBaseUrl()}/reset-password?token=${token}`
    const emailContent = buildPasswordResetEmail({ resetUrl })

    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      userId: user.id,
    })
  }

  return Response.json({
    message:
      "If an account exists for that email, a password reset link has been sent.",
  })
}
