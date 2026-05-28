export function isSameOriginRequest(req: Request) {
  const fetchSite = req.headers.get("sec-fetch-site")

  if (fetchSite === "cross-site") {
    return false
  }

  const origin = req.headers.get("origin")

  if (!origin) {
    return true
  }

  const host = req.headers.get("host")

  if (!host) {
    return false
  }

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function rejectCrossSiteRequest(req: Request) {
  if (isSameOriginRequest(req)) {
    return null
  }

  return Response.json(
    { error: "Cross-site requests are not allowed." },
    { status: 403 }
  )
}
