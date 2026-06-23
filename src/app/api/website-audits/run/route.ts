import { prisma } from "@/lib/data/prisma"
import { checkRequestRateLimit, rateLimitResponse } from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { QueueUnavailableError } from "@/services/queue/client"
import { enqueueOpsJob } from "@/services/queue/jobs"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, "website-audit", {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  const auth = await requireApiBusinessAccess("manageSeo", req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  try {
    const hourlyDedupeKey = [
      "website-audit",
      business.id,
      new Date().toISOString().slice(0, 13),
    ].join(":")
    const { jobRun, deduped } = await enqueueOpsJob({
      type: "WEBSITE_AUDIT",
      name: `Website audit for ${business.name}`,
      businessId: business.id,
      source: auth.access.isOwner ? "OWNER" : "TEAM",
      details: `Audit requested for ${business.website || "saved website"}.`,
      payload: {
        businessId: business.id,
      },
      dedupeKey: hourlyDedupeKey,
      maxAttempts: 3,
    })

    return Response.json(
      {
        job: jobRun,
        deduped,
        message: deduped
          ? "A website audit is already queued for this business."
          : "Website audit queued. The worker will run it in the background.",
      },
      { status: 202 }
    )
  } catch (error) {
    const status = error instanceof QueueUnavailableError ? 503 : 400

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong running the audit.",
      },
      { status }
    )
  }
}
