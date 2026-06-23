import { createHash } from "node:crypto"
import bcrypt from "bcrypt"
import { z } from "zod"
import { passwordSchema } from "@/lib/security/password-policy"
import { prisma } from "@/lib/data/prisma"
import {
  checkRequestRateLimit,
  rateLimitResponse,
} from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { logSecurityEvent } from "@/services/security/security-events"

const confirmSchema = z.object({
  token: z.string().min(32, "Reset token is missing."),
  password: passwordSchema,
})

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, "password-reset-confirm", {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_RESET_CONFIRM_RATE_LIMITED",
      outcome: "BLOCKED",
      summary: "Password reset confirmation blocked by route-level rate limit.",
    })

    return rateLimitResponse(rateLimit.resetAt)
  }

  const body = await req.json().catch(() => ({}))
  const result = confirmSchema.safeParse(body)

  if (!result.success) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_RESET_CONFIRM_FAILED",
      outcome: "FAILURE",
      summary: "Password reset confirmation failed validation.",
      metadata: {
        reason: result.error.issues[0]?.message ?? "Invalid input.",
      },
    })

    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashToken(result.data.token),
    },
  })

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_RESET_CONFIRM_FAILED",
      outcome: "FAILURE",
      actorEmail: resetToken?.email,
      summary: "Password reset confirmation used an invalid or expired token.",
      metadata: {
        tokenFound: Boolean(resetToken),
        tokenUsed: Boolean(resetToken?.usedAt),
        tokenExpired: resetToken
          ? resetToken.expiresAt.getTime() < Date.now()
          : false,
      },
    })

    return Response.json(
      { error: "This reset link is invalid or expired." },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 10)

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: {
        email: resetToken.email,
      },
      data: {
        password: hashedPassword,
      },
      include: {
        business: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
  ])

  await logSecurityEvent({
    req,
    type: "PASSWORD_RESET_COMPLETED",
    actorEmail: user.email,
    userId: user.id,
    businessId: user.business?.id,
    summary: "Account password was reset with a password reset token.",
  })

  return Response.json({
    message: "Password updated. You can log in with the new password.",
  })
}
