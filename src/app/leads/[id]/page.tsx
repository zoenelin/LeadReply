import { getServerSession } from "next-auth"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { ReviewRequestStatusButtons } from "@/app/components/ReviewRequestStatusButtons"
import {
  formatMoney,
  leadSourceLabels,
  leadStatusLabels,
  statusClassName,
} from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"
import { formatDuration, formatServiceEstimate } from "@/lib/service-catalog"
import {
  getReviewStatusLabel,
  reviewStatusClassName,
} from "@/lib/review-funnel"
import { AppNav } from "../../components/AppNav"
import { LeadDetailForm } from "./LeadDetailForm"
import { LeadFollowUpSequence } from "./LeadFollowUpSequence"

type LeadDetailPageProps = {
  params: Promise<{
    id: string
  }>
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

function formatQuoteRange(lowCents: number, highCents: number) {
  if (lowCents > 0 && highCents > 0 && lowCents !== highCents) {
    return `${formatMoney(lowCents)}-${formatMoney(highCents)}`
  }

  if (lowCents > 0) {
    return `Starts at ${formatMoney(lowCents)}`
  }

  if (highCents > 0) {
    return `Up to ${formatMoney(highCents)}`
  }

  return "No estimate matched"
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const lead = await prisma.lead.findFirst({
    where: {
      id,
      business: {
        userId: session.user.id,
      },
    },
    include: {
      business: true,
      serviceOffering: true,
      conciergeIntakes: {
        include: {
          matchedService: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      reviewRequests: {
        orderBy: {
          createdAt: "desc",
        },
      },
      followUpSteps: {
        orderBy: {
          stepOrder: "asc",
        },
      },
    },
  })

  if (!lead) {
    notFound()
  }

  const latestConciergeIntake = lead.conciergeIntakes[0]
  const matchedService =
    lead.serviceOffering ?? latestConciergeIntake?.matchedService ?? null
  const matchedServiceName =
    matchedService?.name ?? latestConciergeIntake?.matchedServiceName ?? ""
  const quoteRange = matchedService
    ? formatServiceEstimate(matchedService)
    : latestConciergeIntake
      ? formatQuoteRange(
          latestConciergeIntake.matchedQuoteLowCents,
          latestConciergeIntake.matchedQuoteHighCents
        )
      : "No estimate matched"
  const durationLabel = matchedService
    ? formatDuration(matchedService.durationMinutes)
    : latestConciergeIntake?.matchedDurationMinutes
      ? formatDuration(latestConciergeIntake.matchedDurationMinutes)
      : "No duration matched"

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <Link
            href="/leads"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Back to leads
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-950">
                  {lead.customerName}
                </h1>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                    lead.status
                  )}`}
                >
                  {leadStatusLabels[lead.status] ?? lead.status}
                </span>
              </div>
              <p className="mt-2 text-slate-600">
                {lead.customerPhone}
                {lead.customerEmail ? ` - ${lead.customerEmail}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {leadSourceLabels[lead.source] ?? lead.source}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Estimated
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatMoney(lead.estimatedValueCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">Won</p>
                <p className="mt-1 text-xl font-bold">
                  {formatMoney(lead.wonValueCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Follow-up
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatDate(lead.followUpAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <LeadDetailForm
              lead={{
                id: lead.id,
                customerName: lead.customerName,
                customerPhone: lead.customerPhone,
                customerEmail: lead.customerEmail,
                source: lead.source,
                status: lead.status,
                estimatedValueCents: lead.estimatedValueCents,
                wonValueCents: lead.wonValueCents,
                notes: lead.notes,
                followUpAt: lead.followUpAt?.toISOString() ?? null,
                followUpNote: lead.followUpNote,
                followUpCompletedAt:
                  lead.followUpCompletedAt?.toISOString() ?? null,
                reviewRequests: lead.reviewRequests.map((request) => ({
                  id: request.id,
                })),
              }}
            />

            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Service and booking
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {matchedServiceName || "No service matched yet"}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">
                      Estimate range
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {quoteRange}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {durationLabel}
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {latestConciergeIntake?.availabilityGuidance ||
                    "Availability guidance will appear after a concierge intake or service setup."}
                </p>
                <Link
                  href="/settings/services"
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Manage services
                </Link>
              </div>

              <LeadFollowUpSequence
                leadId={lead.id}
                customerName={lead.customerName}
                steps={lead.followUpSteps.map((step) => ({
                  id: step.id,
                  title: step.title,
                  message: step.message,
                  channel: step.channel,
                  status: step.status,
                  stepOrder: step.stepOrder,
                  dueAt: step.dueAt?.toISOString() ?? null,
                  sentAt: step.sentAt?.toISOString() ?? null,
                }))}
              />

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Review funnel
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {lead.reviewRequests.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Mark this lead as won, send a review request, then track when
                  the review comes in.
                </p>
                <Link
                  href="/reviews"
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Open funnel
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Review requests
                </p>
                <div className="mt-4 space-y-3">
                  {lead.reviewRequests.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No review requests yet.
                    </div>
                  ) : (
                    lead.reviewRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-semibold text-slate-950">
                              {getReviewStatusLabel(request.status)}
                            </p>
                            <p className="mt-1 text-slate-600">
                              {request.status === "RECEIVED"
                                ? `Received ${formatDate(request.receivedAt)}`
                                : request.status === "SENT"
                                  ? `Sent ${formatDate(request.sentAt)}`
                                  : `Drafted ${formatDate(request.createdAt)}`}
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
                        <p className="mt-3 text-slate-700">{request.message}</p>
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
                <p className="text-sm font-medium text-slate-500">History</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    Created on {formatDate(lead.createdAt)}
                  </div>
                  {lead.closedAt && (
                    <div
                      className="rounded-xl bg-slate-50 px-4 py-3 text-sm"
                    >
                      Closed on {formatDate(lead.closedAt)}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
