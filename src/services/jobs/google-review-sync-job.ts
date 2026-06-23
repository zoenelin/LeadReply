import { syncGoogleBusinessProfileReviews } from "@/services/reviews/review-sync"

export async function runGoogleReviewSyncJob({
  businessId,
}: {
  businessId: string
}) {
  const syncRun = await syncGoogleBusinessProfileReviews({ businessId })

  if (syncRun.status === "FAILED") {
    throw new Error(syncRun.error || "Google review sync failed.")
  }

  return {
    syncRunId: syncRun.id,
    status: syncRun.status,
    reviewsFetched: syncRun.reviewsFetched,
    reviewsMatched: syncRun.reviewsMatched,
  }
}
