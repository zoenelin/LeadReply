import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { ReviewRequestStatusButtons } from "@/app/components/ReviewRequestStatusButtons"
import { prisma } from "@/lib/prisma"
import {
  getReviewFunnelMessage,
  getReviewFunnelStats,
  getReviewStatusLabel,
  reviewStatusClassName,
} from "@/lib/review-funnel"
import { AppNav } from "../components/AppNav"

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

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      leads: {
        orderBy: {
          closedAt: "desc",
        },
        include: {
          reviewRequests: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const reviewFunnelStats = getReviewFunnelStats(business.leads)
  const recentRequests = business.leads
    .flatMap((lead) =>
      lead.reviewRequests.map((request) => ({
        ...request,
        lead,
      }))
    )
    .sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
    )
    .slice(0, 6)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Review funnel
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Turn won customers into reviews
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Track the path from customer won, to review requested, to review
                received for {business.name}.
              </p>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open leads
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Customers won</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {reviewFunnelStats.wonLeadCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Review requested</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {reviewFunnelStats.requestedWonLeadCount}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {reviewFunnelStats.requestRate}% of won customers
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Reviews received</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {reviewFunnelStats.receivedCount}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {reviewFunnelStats.receivedRate}% of sent requests
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Drafts waiting</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {reviewFunnelStats.draftCount}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Funnel status
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {getReviewFunnelMessage(reviewFunnelStats)}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {reviewFunnelStats.funnelSteps.map((step) => (
                <div key={step.label} className="rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {step.label}
                    </p>
                    <span className="text-sm font-bold text-slate-700">
                      {step.percent}%
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-950">
                    {step.count}
                  </p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width:
                          step.percent === 0
                            ? "0%"
                            : `${Math.max(8, step.percent)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Needs a review request
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Won customers without a request
                  </h2>
                </div>
                <span className="w-fit rounded-lg bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  {reviewFunnelStats.notRequestedWonLeads.length} waiting
                </span>
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {reviewFunnelStats.notRequestedWonLeads.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Every won customer has at least started the review workflow.
                  </div>
                ) : (
                  reviewFunnelStats.notRequestedWonLeads.slice(0, 5).map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="grid gap-2 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_8rem]"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {lead.customerName}
                        </p>
                        <p className="text-sm text-slate-600">
                          Won on {formatDate(lead.closedAt)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 sm:text-right">
                        Ask now
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Drafts not sent
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Requests ready to send
                  </h2>
                </div>
                <span className="w-fit rounded-lg bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  {reviewFunnelStats.draftCount} draft
                  {reviewFunnelStats.draftCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {reviewFunnelStats.draftRequests.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No draft review requests are waiting.
                  </div>
                ) : (
                  reviewFunnelStats.draftRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="py-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {request.customerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            Drafted {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${reviewStatusClassName(
                            request.status
                          )}`}
                        >
                          {getReviewStatusLabel(request.status)}
                        </span>
                      </div>
                      <ReviewRequestStatusButtons
                        requestId={request.id}
                        status={request.status}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Waiting for review
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Sent requests to check
                  </h2>
                </div>
                <span className="w-fit rounded-lg bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                  {reviewFunnelStats.sentCount} sent
                </span>
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {reviewFunnelStats.sentRequests.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No sent requests are waiting right now.
                  </div>
                ) : (
                  reviewFunnelStats.sentRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="py-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {request.customerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            Sent {formatDate(request.sentAt)}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${reviewStatusClassName(
                            request.status
                          )}`}
                        >
                          {getReviewStatusLabel(request.status)}
                        </span>
                      </div>
                      <ReviewRequestStatusButtons
                        requestId={request.id}
                        status={request.status}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">
              Recent review activity
            </p>
            <div className="mt-5 divide-y divide-slate-100">
              {recentRequests.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No review requests have been created yet.
                </div>
              ) : (
                recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-3 py-4 lg:grid-cols-[1fr_8rem_10rem]"
                  >
                    <div>
                      <Link
                        href={`/leads/${request.lead.id}`}
                        className="font-semibold text-slate-950 hover:text-slate-700"
                      >
                        {request.customerName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-600">
                        {request.message}
                      </p>
                    </div>
                    <span
                      className={`h-fit w-fit rounded-lg px-2 py-1 text-xs font-bold ${reviewStatusClassName(
                        request.status
                      )}`}
                    >
                      {getReviewStatusLabel(request.status)}
                    </span>
                    <p className="text-sm font-medium text-slate-500 lg:text-right">
                      {request.status === "RECEIVED"
                        ? formatDate(request.receivedAt)
                        : request.status === "SENT"
                          ? formatDate(request.sentAt)
                          : formatDate(request.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
