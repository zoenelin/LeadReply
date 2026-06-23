import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/data/prisma"
import { communicationStatuses } from "@/lib/domain/status"
import {
  fetchGoogleBusinessProfileReviews,
  getGoogleReviewId,
  googleReviewProvider,
  googleStarRatingToNumber,
  type GoogleBusinessProfileReview,
} from "@/services/reviews/google-business-profile"

type SyncGoogleReviewsInput = {
  businessId: string
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function namesMatch(left: string, right: string) {
  const leftName = normalizeName(left)
  const rightName = normalizeName(right)

  if (!leftName || !rightName) {
    return false
  }

  if (leftName === rightName) {
    return true
  }

  const leftParts = new Set(leftName.split(" ").filter(Boolean))
  const rightParts = rightName.split(" ").filter(Boolean)

  return rightParts.some((part) => part.length > 2 && leftParts.has(part))
}

function getReviewDate(value?: string) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

async function findMatchingReviewRequest({
  businessId,
  reviewerName,
  reviewCreatedAt,
}: {
  businessId: string
  reviewerName: string
  reviewCreatedAt: Date | null
}) {
  const requests = await prisma.reviewRequest.findMany({
    where: {
      businessId,
      status: {
        in: [communicationStatuses.sent, communicationStatuses.delivered],
      },
      externalReview: null,
      sentAt: reviewCreatedAt
        ? {
            lte: reviewCreatedAt,
          }
        : undefined,
    },
    orderBy: {
      sentAt: "desc",
    },
    take: 100,
  })

  const directNameMatch = requests.find((request) =>
    namesMatch(request.customerName, reviewerName)
  )

  if (directNameMatch) {
    return {
      request: directNameMatch,
      confidence: 95,
    }
  }

  const recentRequest = requests[0]

  if (recentRequest && reviewCreatedAt && recentRequest.sentAt) {
    const daysSinceRequest =
      Math.abs(reviewCreatedAt.getTime() - recentRequest.sentAt.getTime()) /
      (1000 * 60 * 60 * 24)

    if (daysSinceRequest <= 14) {
      return {
        request: recentRequest,
        confidence: 55,
      }
    }
  }

  return {
    request: null,
    confidence: 0,
  }
}

async function upsertExternalReview({
  businessId,
  connectionId,
  review,
}: {
  businessId: string
  connectionId: string | null
  review: GoogleBusinessProfileReview
}) {
  const providerReviewId = getGoogleReviewId(review)

  if (!providerReviewId) {
    return null
  }

  const reviewerName = review.reviewer?.displayName ?? ""
  const reviewCreatedAt = getReviewDate(review.createTime)
  const reviewUpdatedAt = getReviewDate(review.updateTime)
  const match = await findMatchingReviewRequest({
    businessId,
    reviewerName,
    reviewCreatedAt,
  })

  const externalReview = await prisma.externalReview.upsert({
    where: {
      provider_providerReviewId: {
        provider: googleReviewProvider,
        providerReviewId,
      },
    },
    create: {
      provider: googleReviewProvider,
      providerReviewId,
      providerReviewName: review.name ?? "",
      reviewerName,
      reviewerProfilePhotoUrl: review.reviewer?.profilePhotoUrl ?? "",
      rating: googleStarRatingToNumber(review.starRating),
      comment: review.comment ?? "",
      reviewCreatedAt,
      reviewUpdatedAt,
      matchedConfidence: match.confidence,
      rawPayload: toJson(review),
      businessId,
      connectionId,
      reviewRequestId: match.request?.id ?? null,
    },
    update: {
      providerReviewName: review.name ?? "",
      reviewerName,
      reviewerProfilePhotoUrl: review.reviewer?.profilePhotoUrl ?? "",
      rating: googleStarRatingToNumber(review.starRating),
      comment: review.comment ?? "",
      reviewCreatedAt,
      reviewUpdatedAt,
      matchedConfidence: match.confidence,
      rawPayload: toJson(review),
      businessId,
      connectionId: connectionId ?? undefined,
      reviewRequestId: match.request?.id ?? undefined,
    },
  })

  if (match.request) {
    await prisma.reviewRequest.update({
      where: {
        id: match.request.id,
      },
      data: {
        status: communicationStatuses.received,
        receivedAt: reviewCreatedAt ?? new Date(),
      },
    })
  }

  return {
    externalReview,
    matched: Boolean(match.request),
  }
}

export async function syncGoogleBusinessProfileReviews({
  businessId,
}: SyncGoogleReviewsInput) {
  const connection = await prisma.reviewProviderConnection.findUnique({
    where: {
      businessId_provider: {
        businessId,
        provider: googleReviewProvider,
      },
    },
  })
  const accountId =
    connection?.accountId || process.env.GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID || ""
  const locationId =
    connection?.locationId ||
    process.env.GOOGLE_BUSINESS_PROFILE_LOCATION_ID ||
    ""
  const accessToken =
    connection?.accessTokenEncrypted ||
    process.env.GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN ||
    ""
  const syncRun = await prisma.reviewSyncRun.create({
    data: {
      businessId,
      connectionId: connection?.id ?? null,
      provider: googleReviewProvider,
      status: "RUNNING",
    },
  })

  try {
    if (!connection && (!accountId || !locationId || !accessToken)) {
      throw new Error(
        "Google review API is not connected yet. Add the account ID, location ID, and access token before syncing."
      )
    }

    const reviews = await fetchGoogleBusinessProfileReviews({
      accountId,
      locationId,
      accessToken,
    })
    let matchedCount = 0

    for (const review of reviews) {
      const result = await upsertExternalReview({
        businessId,
        connectionId: connection?.id ?? null,
        review,
      })

      if (result?.matched) {
        matchedCount += 1
      }
    }

    const finishedRun = await prisma.reviewSyncRun.update({
      where: {
        id: syncRun.id,
      },
      data: {
        status: "SUCCEEDED",
        reviewsFetched: reviews.length,
        reviewsMatched: matchedCount,
        finishedAt: new Date(),
        rawSummary: toJson({
          provider: googleReviewProvider,
          accountId,
          locationId,
        }),
      },
    })

    await prisma.reviewProviderConnection.upsert({
      where: {
        businessId_provider: {
          businessId,
          provider: googleReviewProvider,
        },
      },
      create: {
        businessId,
        provider: googleReviewProvider,
        status: "CONNECTED",
        accountId,
        locationId,
        lastSyncAt: new Date(),
      },
      update: {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        lastError: "",
      },
    })

    return finishedRun
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google review sync failed."

    await prisma.reviewProviderConnection.upsert({
      where: {
        businessId_provider: {
          businessId,
          provider: googleReviewProvider,
        },
      },
      create: {
        businessId,
        provider: googleReviewProvider,
        status: "ACTION_REQUIRED",
        accountId,
        locationId,
        lastError: message,
      },
      update: {
        status: "ACTION_REQUIRED",
        lastError: message,
      },
    })

    return prisma.reviewSyncRun.update({
      where: {
        id: syncRun.id,
      },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    })
  }
}
