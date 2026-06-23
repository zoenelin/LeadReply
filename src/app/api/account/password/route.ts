import bcrypt from "bcrypt"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { passwordSchema } from "@/lib/security/password-policy"
import {
  checkRequestRateLimit,
  rateLimitResponse,
} from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { logSecurityEvent } from "@/services/security/security-events"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword: passwordSchema,
})

export async function PATCH(req: Request) {
  const blockedResponse = rejectCrossSiteRequest(req)

  if (blockedResponse) {
    return blockedResponse
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const rateLimit = checkRequestRateLimit(
    req,
    `password-change:${session.user.id}`,
    {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    }
  )

  if (!rateLimit.allowed) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_CHANGE_RATE_LIMITED",
      outcome: "BLOCKED",
      actorEmail: session.user.email,
      userId: session.user.id,
      summary: "Password change blocked by route-level rate limit.",
    })

    return rateLimitResponse(rateLimit.resetAt)
  }

  const body = await req.json().catch(() => ({}))
  const result = changePasswordSchema.safeParse(body)

  if (!result.success) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_CHANGE_FAILED",
      outcome: "FAILURE",
      actorEmail: session.user.email,
      userId: session.user.id,
      summary: "Password change failed validation.",
      metadata: {
        reason: result.error.issues[0]?.message ?? "Invalid password.",
      },
    })

    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid password." },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      business: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!user) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_CHANGE_FAILED",
      outcome: "FAILURE",
      actorEmail: session.user.email,
      userId: session.user.id,
      summary: "Password change requested for a missing account.",
    })

    return Response.json({ error: "Account not found." }, { status: 404 })
  }

  const currentPasswordMatches = await bcrypt.compare(
    result.data.currentPassword,
    user.password
  )

  if (!currentPasswordMatches) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_CHANGE_FAILED",
      outcome: "FAILURE",
      actorEmail: user.email,
      userId: user.id,
      businessId: user.business?.id,
      summary: "Current password did not match.",
    })

    return Response.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    )
  }

  const newPasswordMatchesCurrent = await bcrypt.compare(
    result.data.newPassword,
    user.password
  )

  if (newPasswordMatchesCurrent) {
    await logSecurityEvent({
      req,
      type: "PASSWORD_CHANGE_FAILED",
      outcome: "FAILURE",
      actorEmail: user.email,
      userId: user.id,
      businessId: user.business?.id,
      summary: "New password matched the current password.",
    })

    return Response.json(
      { error: "Choose a new password that is different from the current one." },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(result.data.newPassword, 10)

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  })

  await logSecurityEvent({
    req,
    type: "PASSWORD_CHANGED",
    actorEmail: user.email,
    userId: user.id,
    businessId: user.business?.id,
    summary: "Account password was changed.",
  })

  return Response.json({ message: "Password updated." })
}
