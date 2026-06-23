import { createHash } from "node:crypto"
import bcrypt from "bcrypt"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { passwordSchema } from "@/lib/security/password-policy"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { logSecurityEvent } from "@/services/security/security-events"

const acceptInviteSchema = z.object({
  token: z.string().trim().optional().default(""),
  email: z.string().email("Enter the invited email.").optional(),
  code: z.string().trim().optional().default(""),
  name: z.string().trim().max(120).optional().default(""),
  password: passwordSchema,
}).refine(
  (data) =>
    data.token.length >= 20 ||
    (Boolean(data.email) && /^\d{6}$/.test(data.code)),
  {
    message: "Enter a valid invite link or a 6-digit invite code.",
    path: ["code"],
  }
)

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function normalizePermissionInput(value: unknown): Prisma.InputJsonValue {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : []
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const body = await req.json().catch(() => ({}))
  const result = acceptInviteSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const tokenHash = result.data.token ? hashSecret(result.data.token) : ""
  const codeHash = result.data.code ? hashSecret(result.data.code) : ""
  const invitation = result.data.token
    ? await prisma.teamInvitation.findUnique({
        where: {
          tokenHash,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    : await prisma.teamInvitation.findFirst({
        where: {
          email: result.data.email?.toLowerCase().trim(),
          codeHash,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.revokedAt ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date()
  ) {
    await logSecurityEvent({
      req,
      type: "TEAM_INVITE_ACCEPT_FAILED",
      outcome: "FAILURE",
      summary: "Team invite acceptance failed because the invite is unavailable.",
      metadata: {
        tokenHash,
        codeHash,
        email: result.data.email?.toLowerCase().trim() ?? "",
      },
    })

    return Response.json(
      { error: "This invite is expired, used, or no longer active." },
      { status: 400 }
    )
  }

  const email = invitation.email.toLowerCase().trim()
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      business: {
        select: {
          id: true,
        },
      },
    },
  })

  if (existingUser?.business) {
    return Response.json(
      {
        error:
          "This email already owns a LeadReply business. Use a staff-only email for this invite.",
      },
      { status: 400 }
    )
  }

  if (existingUser) {
    const passwordMatches = await bcrypt.compare(
      result.data.password,
      existingUser.password
    )

    if (!passwordMatches) {
      await logSecurityEvent({
        req,
        type: "TEAM_INVITE_ACCEPT_FAILED",
        outcome: "FAILURE",
        actorEmail: email,
        userId: existingUser.id,
        businessId: invitation.businessId,
        summary:
          "Team invite acceptance failed because the existing password did not match.",
      })

      return Response.json(
        { error: "That email already has an account. Enter its password." },
        { status: 400 }
      )
    }
  }

  const now = new Date()
  const passwordHash = existingUser
    ? existingUser.password
    : await bcrypt.hash(result.data.password, 10)
  const permissions = normalizePermissionInput(invitation.permissions)
  const user = await prisma.$transaction(async (tx) => {
    const acceptedUser =
      existingUser ??
      (await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: "STAFF",
        },
      }))

    await tx.businessMembership.upsert({
      where: {
        businessId_userId: {
          businessId: invitation.businessId,
          userId: acceptedUser.id,
        },
      },
      create: {
        businessId: invitation.businessId,
        userId: acceptedUser.id,
        role: invitation.role,
        status: "ACTIVE",
        permissions,
        invitedByUserId: invitation.invitedByUserId,
        acceptedAt: now,
      },
      update: {
        role: invitation.role,
        status: "ACTIVE",
        permissions,
        invitedByUserId: invitation.invitedByUserId,
        acceptedAt: now,
        disabledAt: null,
      },
    })

    await tx.teamMember.upsert({
      where: {
        businessId_email: {
          businessId: invitation.businessId,
          email,
        },
      },
      create: {
        businessId: invitation.businessId,
        name: result.data.name || invitation.name,
        email,
        role: invitation.role,
        status: "ACTIVE",
        permissions,
        userId: acceptedUser.id,
        acceptedAt: now,
      },
      update: {
        name: result.data.name || invitation.name,
        role: invitation.role,
        status: "ACTIVE",
        permissions,
        userId: acceptedUser.id,
        acceptedAt: now,
      },
    })

    await tx.teamInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: now,
        acceptedByUserId: acceptedUser.id,
      },
    })

    return acceptedUser
  })

  await logSecurityEvent({
    req,
    type: "TEAM_INVITE_ACCEPTED",
    actorEmail: user.email,
    userId: user.id,
    businessId: invitation.businessId,
    summary: "Team invite accepted and business membership activated.",
    metadata: {
      role: invitation.role,
      invitationId: invitation.id,
      businessName: invitation.business.name,
    },
  })

  return Response.json({
    message: "Invite accepted.",
    user: {
      id: user.id,
      email: user.email,
    },
    business: invitation.business,
  })
}
