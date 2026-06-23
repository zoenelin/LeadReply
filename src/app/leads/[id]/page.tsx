import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { ReviewRequestStatusButtons } from "@/features/reviews/ReviewRequestStatusButtons"
import {
  appointmentStatusLabels,
  formatMoney,
  leadStatusLabels,
  normalizeLeadStatus,
  statusClassName,
} from "@/lib/domain/lead-options"
import { prisma } from "@/lib/data/prisma"
import { formatDuration, formatServiceEstimate } from "@/lib/domain/service-catalog"
import {
  getReviewStatusLabel,
  reviewStatusClassName,
} from "@/lib/domain/review-funnel"
import { AppNav } from "@/components/AppNav"
import { LeadDetailForm } from "@/features/leads/LeadDetailForm"
import { LeadFollowUpSequence } from "@/features/leads/LeadFollowUpSequence"
import { LeadTeamNotes } from "@/features/leads/LeadTeamNotes"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Customer/Job Detail",
  description: "Review and update a LeadReply customer and job record.",
  robots: {
    index: false,
    follow: false,
  },
}

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

  const access = await getBusinessAccessForSession(session, "manageLeads")

  if (!access) {
    redirect("/dashboard")
  }

  const { id } = await params
  const lead = await prisma.lead.findFirst({
    where: {
      id,
      businessId: access.businessId,
    },
    include: {
      customer: {
        include: {
          activities: {
            orderBy: {
              occurredAt: "desc",
            },
            take: 20,
          },
        },
      },
      job: true,
      serviceOffering: true,
      missedCallAssistantIntakes: {
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
      teamNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!lead) {
    notFound()
  }

  const latestMissedCallAssistantIntake = lead.missedCallAssistantIntakes[0]
  const matchedService =
    lead.serviceOffering ?? latestMissedCallAssistantIntake?.matchedService ?? null
  const matchedServiceName =
    matchedService?.name ?? latestMissedCallAssistantIntake?.matchedServiceName ?? ""
  const quoteRange = matchedService
    ? formatServiceEstimate(matchedService)
    : latestMissedCallAssistantIntake
      ? formatQuoteRange(
          latestMissedCallAssistantIntake.matchedQuoteLowCents,
          latestMissedCallAssistantIntake.matchedQuoteHighCents
        )
      : "No estimate matched"
  const durationLabel = matchedService
    ? formatDuration(matchedService.durationMinutes)
    : latestMissedCallAssistantIntake?.matchedDurationMinutes
      ? formatDuration(latestMissedCallAssistantIntake.matchedDurationMinutes)
      : "No duration matched"
  const appointmentStatus =
    lead.job?.appointmentStatus ?? lead.appointmentStatus
  const appointmentAt = lead.job?.appointmentAt ?? lead.appointmentAt
  const jobStatus = lead.job?.status ?? "Not synced"
  const jobTitle = lead.job?.title || matchedServiceName || "Service request"

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1400px]">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
          <Link
            href="/leads"
            className="text-sm font-medium text-lr-muted hover:text-lr-strong"
          >
            Back to Customers/Jobs
          </Link>

          <div className="mt-6 border-b border-lr-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-lr-strong">
                {lead.customer?.name || lead.customerName}
              </h1>
              <span
                className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                  lead.status
                )}`}
              >
                {leadStatusLabels[normalizeLeadStatus(lead.status)] ??
                  lead.status}
              </span>
              {lead.job && (
                <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-body">
                  Job: {lead.job.status}
                </span>
              )}
            </div>
            {lead.job && (
              <p className="mt-3 text-sm font-semibold text-lr-muted">
                {lead.job.title}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div id="lead-details">
              <LeadDetailForm
                lead={{
                  id: lead.id,
                  customerName: lead.customer?.name ?? lead.customerName,
                  customerPhone: lead.customer?.phone ?? lead.customerPhone,
                  customerEmail: lead.customer?.email ?? lead.customerEmail,
                  source: lead.source,
                  sourceDetail: lead.sourceDetail,
                  marketingCampaignId: lead.marketingCampaignId,
                  status: lead.status,
                  estimatedValueCents: lead.estimatedValueCents,
                  capturedValueCents:
                    lead.job?.capturedValueCents ?? lead.capturedValueCents,
                  notes: lead.job?.notes ?? lead.notes,
                  followUpAt:
                    lead.job?.followUpAt?.toISOString() ??
                    lead.followUpAt?.toISOString() ??
                    null,
                  followUpNote: lead.job?.followUpNote ?? lead.followUpNote,
                  followUpCompletedAt:
                    lead.followUpCompletedAt?.toISOString() ?? null,
                  appointmentStatus:
                    lead.job?.appointmentStatus ?? lead.appointmentStatus,
                  appointmentAt:
                    lead.job?.appointmentAt?.toISOString() ??
                    lead.appointmentAt?.toISOString() ??
                    null,
                  appointmentNotes:
                    lead.job?.appointmentNotes ?? lead.appointmentNotes,
                }}
              />
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-lr-border p-5">
                <p className="text-sm font-medium text-lr-subtle">
                  Job overview
                </p>
                <h2 className="mt-2 text-xl font-bold text-lr-strong">
                  {jobTitle}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3">
                    <p className="text-xs font-medium text-lr-subtle">
                      Customer
                    </p>
                    <p className="mt-1 text-sm font-bold text-lr-strong">
                      {lead.customer?.name || lead.customerName}
                    </p>
                  </div>
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3">
                    <p className="text-xs font-medium text-lr-subtle">
                      Job status
                    </p>
                    <p className="mt-1 text-sm font-bold text-lr-strong">
                      {jobStatus}
                    </p>
                  </div>
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3">
                    <p className="text-xs font-medium text-lr-subtle">
                      Appointment
                    </p>
                    <p className="mt-1 text-sm font-bold text-lr-strong">
                      {appointmentAt ? formatDate(appointmentAt) : "Not scheduled"}
                    </p>
                    <p className="mt-1 text-xs text-lr-muted">
                      {appointmentStatusLabels[appointmentStatus] ??
                        appointmentStatus}
                    </p>
                  </div>
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3">
                    <p className="text-xs font-medium text-lr-subtle">
                      Estimate
                    </p>
                    <p className="mt-1 text-sm font-bold text-lr-strong">
                      {quoteRange}
                    </p>
                  </div>
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3">
                    <p className="text-xs font-medium text-lr-subtle">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-bold text-lr-strong">
                      {durationLabel}
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-body">
                  {latestMissedCallAssistantIntake?.availabilityGuidance ||
                    "Availability guidance will appear after a missed-call assistant intake or service setup."}
                </p>
                <Link
                  href="/settings/services"
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
                >
                  Manage services
                </Link>
              </div>

              {latestMissedCallAssistantIntake && (
                <div
                  id="ai-intake"
                  className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-800">
                    missed-call assistant intake
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-lr-strong">
                    {latestMissedCallAssistantIntake.summary || "Summary pending"}
                  </h2>
                  <p className="mt-2 text-sm text-lr-body">
                    {latestMissedCallAssistantIntake.nextAction ||
                      "Review the customer answers and choose the next step."}
                  </p>
                </div>
              )}

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

              <LeadTeamNotes
                leadId={lead.id}
                notes={lead.teamNotes.map((note) => ({
                  id: note.id,
                  body: note.body,
                  authorName: note.authorName,
                  createdAt: note.createdAt.toISOString(),
                }))}
              />

              <div
                id="review-funnel"
                className="rounded-2xl border border-lr-border p-5"
              >
                <p className="text-sm font-medium text-lr-subtle">
                  Review funnel
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {lead.reviewRequests.length}
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  Mark this job as captured, send a review request, then track
                  when the review comes in.
                </p>
                <Link
                  href="/reviews"
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
                >
                  Open funnel
                </Link>
              </div>

              <div
                id="history"
                className="rounded-2xl border border-lr-border p-5"
              >
                <p className="text-sm font-medium text-lr-subtle">
                  Review requests
                </p>
                <div className="mt-4 space-y-3">
                  {lead.reviewRequests.length === 0 ? (
                    <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted">
                      No review requests yet.
                    </div>
                  ) : (
                    lead.reviewRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-semibold text-lr-strong">
                              {getReviewStatusLabel(request.status)}
                            </p>
                            <p className="mt-1 text-lr-muted">
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
                        <p className="mt-3 text-lr-body">{request.message}</p>
                        <ReviewRequestStatusButtons
                          requestId={request.id}
                          status={request.status}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-lr-border p-5">
                <p className="text-sm font-medium text-lr-subtle">History</p>
                <div className="mt-4 space-y-3">
                  {lead.customer?.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm"
                    >
                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                        <p className="font-semibold text-lr-strong">
                          {activity.title}
                        </p>
                        <p className="text-xs text-lr-subtle">
                          {formatDate(activity.occurredAt)}
                        </p>
                      </div>
                      {activity.body && (
                        <p className="mt-2 whitespace-pre-line text-lr-body">
                          {activity.body}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-lr-subtle">
                        {activity.authorName}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm">
                    Created on {formatDate(lead.createdAt)}
                  </div>
                  {lead.closedAt && (
                    <div
                      className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm"
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
