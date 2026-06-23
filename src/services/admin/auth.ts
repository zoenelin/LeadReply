import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { isAdminEmail } from "@/lib/security/admin"
import { captureException } from "@/services/observability/error-monitoring"
import { logger } from "@/services/observability/logger"
import {
  checkRequestRateLimit,
  rateLimitResponse,
} from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

export async function requireAdminSession() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    }
  }

  if (!isAdminEmail(session.user.email)) {
    return {
      response: Response.json({ error: "Not found." }, { status: 404 }),
    }
  }

  return {
    session,
  }
}

export function guardAdminMutation(req: Request, scope: string) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, `admin:${scope}`, {
    limit: 90,
    windowMs: 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  return null
}

export function logAdminAction(
  action: string,
  context: Record<string, unknown> = {}
) {
  logger.info(`admin.${action}`, context)
}

export function adminErrorResponse(
  error: unknown,
  context: Record<string, unknown> = {}
) {
  captureException(error, {
    area: "admin",
    ...context,
  })

  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  )
}
