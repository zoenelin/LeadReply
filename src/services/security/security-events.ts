import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/data/prisma"
import { logger } from "@/services/observability/logger"

export type SecurityEventActorType = "USER" | "ADMIN" | "SYSTEM"
export type SecurityEventOutcome = "SUCCESS" | "FAILURE" | "BLOCKED"

type SecurityEventInput = {
  type: string
  actorType?: SecurityEventActorType
  actorEmail?: string | null
  outcome?: SecurityEventOutcome
  summary?: string
  metadata?: Record<string, unknown>
  userId?: string | null
  businessId?: string | null
  req?: Request
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || ""
}

function truncate(value: string | null | undefined, length: number) {
  return (value || "").slice(0, length)
}

function getRequestSecurityContext(req?: Request) {
  if (!req) {
    return {
      ipAddress: "",
      userAgent: "",
    }
  }

  return {
    ipAddress: truncate(
      firstHeaderValue(req.headers.get("x-forwarded-for")) ||
        req.headers.get("x-real-ip"),
      120
    ),
    userAgent: truncate(req.headers.get("user-agent"), 500),
  }
}

function safeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return {} as Prisma.InputJsonValue
  }

  try {
    return JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue
  } catch {
    return {
      note: "Metadata could not be serialized.",
    } as Prisma.InputJsonValue
  }
}

export async function logSecurityEvent(input: SecurityEventInput) {
  const requestContext = getRequestSecurityContext(input.req)

  try {
    await prisma.securityEvent.create({
      data: {
        type: truncate(input.type, 120),
        actorType: input.actorType ?? "USER",
        actorEmail: truncate(input.actorEmail, 320),
        outcome: input.outcome ?? "SUCCESS",
        summary: truncate(input.summary, 600),
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        metadata: safeMetadata(input.metadata),
        userId: input.userId || null,
        businessId: input.businessId || null,
      },
    })

    logger.info("security.event", {
      type: input.type,
      actorType: input.actorType ?? "USER",
      actorEmail: input.actorEmail || "",
      outcome: input.outcome ?? "SUCCESS",
      userId: input.userId || "",
      businessId: input.businessId || "",
    })
  } catch (error) {
    logger.warn("security.event_failed", {
      error,
      type: input.type,
      actorType: input.actorType ?? "USER",
      actorEmail: input.actorEmail || "",
      userId: input.userId || "",
      businessId: input.businessId || "",
    })
  }
}
