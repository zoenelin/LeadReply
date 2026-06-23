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

  const rateLimit = checkRequestRateLimit(req, "growth-plan", {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  const auth = await requireApiBusinessAccess("requestGrowthServices", req)

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
    const dailyDedupeKey = [
      "growth-plan",
      business.id,
      new Date().toISOString().slice(0, 10),
    ].join(":")
    const { jobRun, deduped } = await enqueueOpsJob({
      type: "AI_GROWTH_PLAN",
      name: `AI growth plan for ${business.name}`,
      businessId: business.id,
      source: auth.access.isOwner ? "OWNER" : "TEAM",
      details:
        "Generate growth recommendations, internal tasks, and approval-ready marketing ideas.",
      payload: {
        businessId: business.id,
      },
      dedupeKey: dailyDedupeKey,
      maxAttempts: 2,
    })

    return Response.json(
      {
        job: jobRun,
        deduped,
        message: deduped
          ? "A growth plan is already queued for this business today."
          : "Growth plan queued. The worker will generate it in the background.",
      },
      { status: 202 }
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong queueing the growth plan.",
      },
      { status: error instanceof QueueUnavailableError ? 503 : 500 }
    )
  }
}
