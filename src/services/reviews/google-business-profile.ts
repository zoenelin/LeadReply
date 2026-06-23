type GoogleReviewer = {
  displayName?: string
  profilePhotoUrl?: string
}

export type GoogleBusinessProfileReview = {
  reviewId?: string
  name?: string
  reviewer?: GoogleReviewer
  starRating?: string
  comment?: string
  createTime?: string
  updateTime?: string
}

type GoogleReviewListResponse = {
  reviews?: GoogleBusinessProfileReview[]
  nextPageToken?: string
}

type FetchGoogleBusinessProfileReviewsInput = {
  accountId: string
  locationId: string
  accessToken: string
}

export const googleReviewProvider = "GOOGLE_BUSINESS_PROFILE"

const starRatingMap: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
}

export function googleStarRatingToNumber(value?: string) {
  return value ? starRatingMap[value] ?? 0 : 0
}

export function getGoogleReviewId(review: GoogleBusinessProfileReview) {
  if (review.reviewId) {
    return review.reviewId
  }

  return review.name?.split("/").pop() ?? ""
}

export async function fetchGoogleBusinessProfileReviews({
  accountId,
  locationId,
  accessToken,
}: FetchGoogleBusinessProfileReviewsInput) {
  const reviews: GoogleBusinessProfileReview[] = []
  let pageToken = ""

  do {
    const params = new URLSearchParams({
      pageSize: "50",
      orderBy: "updateTime desc",
    })

    if (pageToken) {
      params.set("pageToken", pageToken)
    }

    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `Google Business Profile reviews sync failed (${res.status}): ${body || res.statusText}`
      )
    }

    const data = (await res.json()) as GoogleReviewListResponse

    reviews.push(...(data.reviews ?? []))
    pageToken = data.nextPageToken ?? ""
  } while (pageToken)

  return reviews
}
