import { createHash, randomBytes, randomInt } from "node:crypto"
import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { assignableBusinessRoles } from "@/lib/security/permissions"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { logSecurityEvent } from "@/services/security/security-events"

const inviteSchema = z.object({
  name: z.string().trim().optional().default(""),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(assignableBusinessRoles),
  expiresInHours: z.coerce.number().int().min(1).max(168).default(168),
})

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function makeInviteToken() {
  return randomBytes(32).toString("base64url")
}

function makeInviteCode() {
  return String(randomInt(100000, 1000000))
}

function getOrigin(req: Request) {
  const configuredUrl =
    process.env.APP_BASE_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "")
  }

  return new URL(req.url).origin
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  const body = await req.json().catch(() => ({}))
  const result = inviteSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const email = result.data.email.toLowerCase().trim()
  const token = makeInviteToken()
  const code = makeInviteCode()
  const expiresAt = new Date(
    Date.now() + result.data.expiresInHours * 60 * 60 * 1000
  )

  try {
    const [invitation, member] = await prisma.$transaction([
      prisma.teamInvitation.create({
        data: {
          businessId: auth.access.businessId,
          invitedByUserId: auth.session.user.id,
          name: result.data.name,
          email,
          role: result.data.role,
          tokenHash: hashSecret(token),
          codeHash: hashSecret(code),
          expiresAt,
        },
      }),
      prisma.teamMember.upsert({
        where: {
          businessId_email: {
            businessId: auth.access.businessId,
            email,
          },
        },
        create: {
          businessId: auth.access.businessId,
          name: result.data.name,
          email,
          role: result.data.role,
          status: "INVITED",
          inviteExpiresAt: expiresAt,
        },
        update: {
          name: result.data.name,
          role: result.data.role,
          status: "INVITED",
          invitedAt: new Date(),
          inviteExpiresAt: expiresAt,
        },
      }),
    ])

    await logSecurityEvent({
      req,
      type: "TEAM_INVITE_CREATED",
      actorEmail: auth.session.user.email,
      userId: auth.session.user.id,
      businessId: auth.access.businessId,
      summary: "Owner generated a team invite.",
      metadata: {
        role: result.data.role,
        email,
        expiresAt,
      },
    })

    return Response.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
        member,
        invite: {
          link: `${getOrigin(req)}/invite/${token}`,
          code,
          expiresAt,
        },
      },
      { status: 201 }
    )
  } catch {
    return Response.json(
      { error: "Something went wrong creating the invitation." },
      { status: 500 }
    )
  }
}
