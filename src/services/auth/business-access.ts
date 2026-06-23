import type { Session } from "next-auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import {
  businessRoles,
  roleCan,
  type BusinessCapability,
  type BusinessRole,
} from "@/lib/security/permissions"
import { logSecurityEvent } from "@/services/security/security-events"

type PermissionJson = unknown

export type BusinessAccess = {
  businessId: string
  businessName: string
  ownerUserId: string
  userId: string
  userEmail: string
  role: BusinessRole
  membershipId: string | null
  isOwner: boolean
  customPermissions: BusinessCapability[]
}

type ApiBusinessAccessResult =
  | {
      session: Session
      access: BusinessAccess
    }
  | {
      response: Response
    }

function normalizeRole(role: string): BusinessRole {
  return businessRoles.includes(role as BusinessRole)
    ? (role as BusinessRole)
    : "STAFF"
}

function normalizePermissions(value: PermissionJson): BusinessCapability[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is BusinessCapability => {
    return typeof item === "string"
  })
}

export function hasBusinessCapability(
  access: BusinessAccess,
  capability: BusinessCapability
) {
  return (
    roleCan(access.role, capability) ||
    access.customPermissions.includes(capability)
  )
}

export async function getBusinessAccessForSession(
  session: Session,
  capability?: BusinessCapability
) {
  const userId = session.user.id
  const userEmail = session.user.email ?? ""
  const ownedBusiness = await prisma.business.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  })

  if (ownedBusiness) {
    const ownerAccess: BusinessAccess = {
      businessId: ownedBusiness.id,
      businessName: ownedBusiness.name,
      ownerUserId: ownedBusiness.userId,
      userId,
      userEmail,
      role: "OWNER",
      membershipId: null,
      isOwner: true,
      customPermissions: [],
    }

    return capability && !hasBusinessCapability(ownerAccess, capability)
      ? null
      : ownerAccess
  }

  const membership = await prisma.businessMembership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      disabledAt: null,
    },
    orderBy: [
      {
        acceptedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      business: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  })

  if (!membership) {
    return null
  }

  const access: BusinessAccess = {
    businessId: membership.businessId,
    businessName: membership.business.name,
    ownerUserId: membership.business.userId,
    userId,
    userEmail,
    role: normalizeRole(membership.role),
    membershipId: membership.id,
    isOwner: false,
    customPermissions: normalizePermissions(membership.permissions),
  }

  return capability && !hasBusinessCapability(access, capability)
    ? null
    : access
}

export async function getOwnerBusinessAccessForSession(session: Session) {
  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  })

  if (!business) {
    return null
  }

  return {
    businessId: business.id,
    businessName: business.name,
    ownerUserId: business.userId,
    userId: session.user.id,
    userEmail: session.user.email ?? "",
    role: "OWNER" as const,
    membershipId: null,
    isOwner: true,
    customPermissions: [],
  }
}

export async function requireApiBusinessAccess(
  capability: BusinessCapability,
  req?: Request
): Promise<ApiBusinessAccessResult> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    }
  }

  const access = await getBusinessAccessForSession(session, capability)

  if (!access) {
    await logSecurityEvent({
      req,
      type: "BUSINESS_ACCESS_DENIED",
      outcome: "BLOCKED",
      actorEmail: session.user.email,
      userId: session.user.id,
      summary: `User attempted a business action without ${capability}.`,
      metadata: {
        capability,
      },
    })

    return {
      response: Response.json(
        { error: "You do not have permission to do that." },
        { status: 403 }
      ),
    }
  }

  return {
    session,
    access,
  }
}

export async function requireApiOwnerBusinessAccess(
  req?: Request
): Promise<ApiBusinessAccessResult> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    }
  }

  const access = await getOwnerBusinessAccessForSession(session)

  if (!access) {
    await logSecurityEvent({
      req,
      type: "OWNER_ACCESS_DENIED",
      outcome: "BLOCKED",
      actorEmail: session.user.email,
      userId: session.user.id,
      summary: "User attempted an owner-only action.",
    })

    return {
      response: Response.json(
        { error: "Only the business owner can do that." },
        { status: 403 }
      ),
    }
  }

  return {
    session,
    access,
  }
}
