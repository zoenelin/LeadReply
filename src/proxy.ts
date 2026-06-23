import { NextResponse, type NextRequest } from "next/server"
import {
  checkRequestRateLimit,
  rateLimitResponse,
} from "@/services/security/rate-limit"
import { logger } from "@/services/observability/logger"

// Next.js discovers request proxy logic from this root-level file.
type RouteLimitPolicy = {
  scope: string
  limit: number
  windowMs: number
}

function getRouteLimitPolicy(req: NextRequest): RouteLimitPolicy {
  const path = req.nextUrl.pathname
  const method = req.method.toUpperCase()

  if (method === "GET") {
    return {
      scope: "api-read",
      limit: 300,
      windowMs: 60 * 1000,
    }
  }

  if (path.startsWith("/api/auth")) {
    return {
      scope: "api-auth",
      limit: 60,
      windowMs: 60 * 1000,
    }
  }

  if (
    path.startsWith("/api/signup") ||
    path.startsWith("/api/password-reset") ||
    path.startsWith("/api/account/password")
  ) {
    return {
      scope: "account-security",
      limit: 12,
      windowMs: 15 * 60 * 1000,
    }
  }

  if (path.startsWith("/api/webhooks")) {
    return {
      scope: "webhooks",
      limit: 300,
      windowMs: 60 * 1000,
    }
  }

  if (
    path.startsWith("/api/growth-plan") ||
    path.startsWith("/api/website-audits")
  ) {
    return {
      scope: "ai-heavy",
      limit: 20,
      windowMs: 60 * 60 * 1000,
    }
  }

  if (
    path.startsWith("/api/widget") ||
    path.startsWith("/api/intake") ||
    path.startsWith("/api/missed-call-assistant-intakes")
  ) {
    return {
      scope: "public-intake",
      limit: 120,
      windowMs: 60 * 1000,
    }
  }

  return {
    scope: "api-mutation",
    limit: 120,
    windowMs: 60 * 1000,
  }
}

export function proxy(req: NextRequest) {
  if (req.method === "HEAD" || req.method === "OPTIONS") {
    return NextResponse.next()
  }

  const requestId = req.headers.get("x-request-id") || crypto.randomUUID()
  const policy = getRouteLimitPolicy(req)
  const rateLimit = checkRequestRateLimit(
    req,
    `route:${policy.scope}:${req.method}`,
    policy
  )

  if (!rateLimit.allowed) {
    logger.warn("api.rate_limited", {
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      scope: policy.scope,
      resetAt: new Date(rateLimit.resetAt).toISOString(),
    })

    const response = rateLimitResponse(rateLimit.resetAt)
    response.headers.set("x-request-id", requestId)

    return response
  }

  logger.debug("api.request", {
    requestId,
    method: req.method,
    path: req.nextUrl.pathname,
    scope: policy.scope,
    remaining: rateLimit.remaining,
  })

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-request-id", requestId)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set("x-request-id", requestId)
  response.headers.set("x-rate-limit-remaining", String(rateLimit.remaining))

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
