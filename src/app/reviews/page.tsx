import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { AppNav } from "@/components/AppNav"
import { ReviewDiscountForm } from "@/features/reviews/ReviewDiscountForm"
import { ReviewRequestStatusButtons } from "@/features/reviews/ReviewRequestStatusButtons"
import { ReviewSendButton } from "@/features/reviews/ReviewSendButton"
import { ReviewSyncButton } from "@/features/reviews/ReviewSyncButton"
import { prisma } from "@/lib/data/prisma"
import { getReviewStatusLabel, reviewStatusClassName } from "@/lib/domain/review-funnel"
import { communicationStatuses, leadStatuses } from "@/lib/domain/status"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Send review requests and track which customers have reviewed the business.",
  robots: {
    index: false,
    follow: false,
  },
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set"
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type ReviewRequest = {
  id: string
  status: string
  customerName: string
  customerPhone: string
  deliveryError: string
  createdAt: Date
  sentAt: Date | null
  receivedAt: Date | null
  externalReview: {
    reviewerName: string
    rating: number
    reviewCreatedAt: Date | null
    matchedConfidence: number
  } | null
}

type ReviewCustomerRow = {
  lead: {
    id: string
    customerName: string
    customerPhone: string
    closedAt: Date | null
  }
  draftRequest: ReviewRequest | null
  sentRequest: ReviewRequest | null
  receivedRequest: ReviewRequest | null
}

function getLatestRequest(
  requests: ReviewRequest[],
  status: string
) {
  return requests.find((request) => request.status === status) ?? null
}

function EmptyMessage({ children }: { children: string }) {
  return (
    <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm font-medium text-lr-muted">
      {children}
    </div>
  )
}

function CustomerIdentity({
  name,
  phone,
  detail,
}: {
  name: string
  phone: string
  detail: string
}) {
  return (
    <div>
      <p className="font-bold text-lr-strong">{name}</p>
      <p className="mt-1 text-sm text-lr-muted">{phone}</p>
      <p className="mt-1 text-sm text-lr-subtle">{detail}</p>
    </div>
  )
}

function formatSyncDate(value: Date | null | undefined) {
  if (!value) {
    return "Never checked"
  }

  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "manageReviews")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    include: {
      leads: {
        where: {
          OR: [
            {
              status: leadStatuses.captured,
            },
            {
              reviewRequests: {
                some: {
                  status: communicationStatuses.received,
                },
              },
            },
          ],
        },
        orderBy: [
          {
            closedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        include: {
          reviewRequests: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              externalReview: true,
            },
          },
        },
      },
      reviewProviderConnections: {
        where: {
          provider: "GOOGLE_BUSINESS_PROFILE",
        },
        take: 1,
      },
      reviewSyncRuns: {
        where: {
          provider: "GOOGLE_BUSINESS_PROFILE",
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 1,
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const reviewRows: ReviewCustomerRow[] = business.leads.map((lead) => ({
    lead,
    draftRequest: getLatestRequest(
      lead.reviewRequests,
      communicationStatuses.draft
    ),
    sentRequest: getLatestRequest(lead.reviewRequests, communicationStatuses.sent),
    receivedRequest: getLatestRequest(
      lead.reviewRequests,
      communicationStatuses.received
    ),
  }))
  const needsRequestRows = reviewRows.filter(
    (row) => !row.sentRequest && !row.receivedRequest
  )
  const noReviewYetRows = reviewRows.filter(
    (row) => row.sentRequest && !row.receivedRequest
  )
  const reviewLeftRows = reviewRows.filter((row) => row.receivedRequest)
  const googleConnection = business.reviewProviderConnections[0] ?? null
  const latestSyncRun = business.reviewSyncRuns[0] ?? null
  const googleReady =
    googleConnection?.status === "CONNECTED" ||
    Boolean(
      process.env.GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID &&
        process.env.GOOGLE_BUSINESS_PROFILE_LOCATION_ID &&
        process.env.GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN
    )

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />

        <section className="mt-8 space-y-6 rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Reviews
              </p>
              <h1 className="mt-2 text-3xl font-black text-lr-strong">
                Ask happy customers for reviews
              </h1>
              <p className="mt-3 max-w-2xl text-lr-muted">
                Keep this simple: send requests, see who has not reviewed yet,
                and let LeadReply check Google reviews automatically.
              </p>
            </div>
            <Link
              href="/settings/automation"
              className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-bold text-lr-strong hover:bg-lr-hover"
            >
              Review link settings
            </Link>
          </div>

          {!business.googleReviewUrl && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
              Add the business review link in settings before sending real
              requests, so customers land in the right place.
            </div>
          )}

          <div className="grid gap-4 rounded-2xl border border-lr-border bg-lr-surface-muted p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
                Google review API
              </p>
              <h2 className="mt-2 text-xl font-black text-lr-strong">
                {googleReady ? "Connected" : "Needs setup"}
              </h2>
              <p className="mt-2 text-sm text-lr-muted">
                LeadReply syncs Google Business Profile reviews, matches them
                to sent requests when possible, and moves customers to Review
                received automatically.
              </p>
              <p className="mt-2 text-xs font-semibold text-lr-subtle">
                Last check: {formatSyncDate(latestSyncRun?.finishedAt)}
                {latestSyncRun?.status ? ` · ${latestSyncRun.status}` : ""}
                {latestSyncRun?.error ? ` · ${latestSyncRun.error}` : ""}
              </p>
            </div>
            <ReviewSyncButton disabled={!googleReady} />
          </div>

          <ReviewDiscountForm
            initialEnabled={business.reviewDiscountEnabled}
            initialOffer={business.reviewDiscountOffer}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm font-bold text-lr-subtle">Need request</p>
              <p className="mt-2 text-3xl font-black text-lr-strong">
                {needsRequestRows.length}
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm font-bold text-lr-subtle">No review yet</p>
              <p className="mt-2 text-3xl font-black text-lr-strong">
                {noReviewYetRows.length}
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm font-bold text-lr-subtle">Review received</p>
              <p className="mt-2 text-3xl font-black text-lr-strong">
                {reviewLeftRows.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-lr-border p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-lr-strong">
                  Need a review request sent
                </h2>
                <p className="mt-1 text-sm text-lr-muted">
                  Captured customers who have not received a review request yet.
                </p>
              </div>
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                {needsRequestRows.length}
              </span>
            </div>

            <div className="mt-5 divide-y divide-lr-border">
              {needsRequestRows.length === 0 ? (
                <EmptyMessage>No customers are waiting for a request.</EmptyMessage>
              ) : (
                needsRequestRows.map((row) => (
                  <div
                    key={row.lead.id}
                    className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <CustomerIdentity
                      name={row.lead.customerName}
                      phone={row.lead.customerPhone}
                      detail={
                        row.lead.closedAt
                          ? `Closed ${formatDate(row.lead.closedAt)}`
                          : "Captured customer"
                      }
                    />
                    {row.draftRequest ? (
                      <ReviewSendButton requestId={row.draftRequest.id} />
                    ) : (
                      <ReviewSendButton leadId={row.lead.id} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-lr-border p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-lr-strong">
                  Sent, no review yet
                </h2>
                <p className="mt-1 text-sm text-lr-muted">
                  LeadReply checks Google reviews automatically. Use the manual
                  button only as a backup.
                </p>
              </div>
              <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
                {noReviewYetRows.length}
              </span>
            </div>

            <div className="mt-5 divide-y divide-lr-border">
              {noReviewYetRows.length === 0 ? (
                <EmptyMessage>No sent requests are waiting right now.</EmptyMessage>
              ) : (
                noReviewYetRows.map((row) => {
                  const request = row.sentRequest

                  if (!request) {
                    return null
                  }

                  return (
                    <div
                      key={request.id}
                      className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div>
                        <CustomerIdentity
                          name={row.lead.customerName}
                          phone={row.lead.customerPhone}
                          detail={`Sent ${formatDate(request.sentAt)}`}
                        />
                        {request.deliveryError && (
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Delivery note: {request.deliveryError}
                          </p>
                        )}
                      </div>
                      <ReviewRequestStatusButtons
                        requestId={request.id}
                        status={request.status}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-lr-border p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-lr-strong">
                  Review received
                </h2>
                <p className="mt-1 text-sm text-lr-muted">
                  Customers who completed the review step.
                </p>
              </div>
              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {reviewLeftRows.length}
              </span>
            </div>

            <div className="mt-5 divide-y divide-lr-border">
              {reviewLeftRows.length === 0 ? (
                <EmptyMessage>No synced or manually received reviews yet.</EmptyMessage>
              ) : (
                reviewLeftRows.map((row) => {
                  const request = row.receivedRequest

                  if (!request) {
                    return null
                  }

                  return (
                    <div
                      key={request.id}
                      className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div>
                        <CustomerIdentity
                          name={row.lead.customerName}
                          phone={row.lead.customerPhone}
                          detail={`Review received ${formatDate(
                            request.externalReview?.reviewCreatedAt ??
                              request.receivedAt
                          )}`}
                        />
                        {request.externalReview && (
                          <p className="mt-2 text-sm font-medium text-lr-muted">
                            Synced from Google:{" "}
                            {request.externalReview.reviewerName || "Reviewer"} ·{" "}
                            {request.externalReview.rating || "No"} stars ·{" "}
                            {request.externalReview.matchedConfidence}% match
                          </p>
                        )}
                      </div>
                      <span
                        className={`h-fit w-fit rounded-lg px-3 py-1 text-sm font-bold ${reviewStatusClassName(
                          request.status
                        )}`}
                      >
                        {getReviewStatusLabel(request.status)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
