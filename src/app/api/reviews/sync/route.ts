import { enqueueOpsJob } from "@/services/queue/jobs"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageReviews", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const businessId = auth.access.businessId
    const { jobRun, deduped } = await enqueueOpsJob({
      type: "GOOGLE_REVIEW_SYNC",
      name: "Google review sync",
      businessId,
      source: "REVIEWS",
      details:
        "Fetch Google Business Profile reviews and match them to LeadReply review requests.",
      payload: {
        businessId,
      },
      dedupeKey: `google-review-sync:${businessId}`,
      maxAttempts: 3,
    })

    return Response.json({
      queued: true,
      deduped,
      jobRun,
    })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not queue Google review sync.",
      },
      { status: 500 }
    )
  }
}
