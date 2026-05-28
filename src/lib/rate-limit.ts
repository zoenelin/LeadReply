type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitRecord = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitRecord>()

function getIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return req.headers.get("x-real-ip") || "unknown"
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  buckets.set(key, current)

  return {
    allowed: true,
    remaining: limit - current.count,
    resetAt: current.resetAt,
  }
}

export function checkRequestRateLimit(
  req: Request,
  scope: string,
  options: Omit<RateLimitOptions, "key">
) {
  return checkRateLimit({
    key: `${scope}:${getIp(req)}`,
    ...options,
  })
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  )
}
