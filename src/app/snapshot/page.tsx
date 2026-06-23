import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { getMissedCallAssistantStats } from "@/lib/domain/missed-call-assistant"
import {
  communicationStatuses,
  missedCallAssistantStatuses,
  leadStatuses,
  missedCallStatuses,
  openLeadStatuses,
} from "@/lib/domain/status"
import { getFollowUpSequenceStats } from "@/lib/domain/follow-up-sequences"
import { formatMoney } from "@/lib/domain/lead-options"
import { prisma } from "@/lib/data/prisma"
import {
  formatResponseDuration,
  getResponseSpeedStats,
} from "@/lib/analytics/response-speed"
import {
  getReviewFunnelMessage,
  getReviewFunnelStats,
} from "@/lib/domain/review-funnel"
import { buildRevenueSummaryRows } from "@/lib/analytics/reporting"
import { AppNav } from "@/components/AppNav"
import { SnapshotPriorityCard } from "@/features/snapshot/SnapshotPriorityCard"
import {
  formatSnapshotTime,
  getPriorityAction,
} from "@/features/snapshot/snapshot-priority"

export const metadata: Metadata = {
  title: "Snapshot",
  description:
    "A simple owner snapshot for the most important LeadReply action right now.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SnapshotPage() {
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
          createdAt: "desc",
        },
        include: {
          reviewRequests: true,
        },
      },
      missedCalls: {
        orderBy: {
          createdAt: "desc",
        },
      },
      followUpSteps: {
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            stepOrder: "asc",
          },
        ],
        include: {
          lead: {
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
              estimatedValueCents: true,
            },
          },
        },
      },
      missedCallAssistantIntakes: {
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          missedCall: {
            select: {
              callerName: true,
              callerPhone: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviewRequests: true,
        },
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const currentDayStart = new Date()
  currentDayStart.setHours(0, 0, 0, 0)

  const currentDayEnd = new Date()
  currentDayEnd.setHours(23, 59, 59, 999)

  const followUpsDue = business.leads
    .filter(
      (lead) =>
        lead.followUpAt &&
        lead.followUpAt <= currentDayEnd &&
        !lead.followUpCompletedAt &&
        openLeadStatuses.includes(
          lead.status as (typeof openLeadStatuses)[number]
        )
    )
    .sort(
      (left, right) =>
        (left.followUpAt?.getTime() ?? 0) - (right.followUpAt?.getTime() ?? 0)
    )
  const newMissedCalls = business.missedCalls.filter(
    (call) => call.status === missedCallStatuses.new
  )
  const followUpSequenceStats = getFollowUpSequenceStats(
    business.followUpSteps
  )
  const missedCallAssistantStats = getMissedCallAssistantStats(business.missedCallAssistantIntakes)
  const readyMissedCallAssistantIntakes = business.missedCallAssistantIntakes.filter(
    (intake) => intake.status === missedCallAssistantStatuses.readyForOwner
  )
  const dueSequenceSteps = business.followUpSteps.filter(
    (step) =>
      step.status === communicationStatuses.draft &&
      step.dueAt &&
      step.dueAt <= currentDayEnd
  )
  const newLeads = business.leads.filter(
    (lead) => lead.status === leadStatuses.new
  )
  const currentDayLeads = business.leads.filter(
    (lead) =>
      lead.createdAt >= currentDayStart && lead.createdAt <= currentDayEnd
  )
  const capturedLeads = business.leads.filter(
    (lead) =>
      lead.status === leadStatuses.captured ||
      (lead.status === leadStatuses.closed && lead.capturedValueCents > 0)
  )
  const capturedRevenueCents = capturedLeads.reduce(
    (total, lead) => total + lead.capturedValueCents,
    0
  )
  const sourceRows = buildRevenueSummaryRows(business.leads)
  const responseStats = getResponseSpeedStats(business.missedCalls)
  const reviewFunnelStats = getReviewFunnelStats(business.leads)
  const bestSource = [...sourceRows]
    .filter((source) => source.leadCount > 0)
    .sort(
      (left, right) =>
        right.revenueCents - left.revenueCents ||
        right.leadCount - left.leadCount
    )[0]
  const priorityAction = getPriorityAction({
    missedCallAssistantIntake: readyMissedCallAssistantIntakes[0] ?? null,
    sequenceStep: dueSequenceSteps[0] ?? null,
    followUp: followUpsDue[0] ?? null,
    missedCall: newMissedCalls[0] ?? null,
    newLead: newLeads[0] ?? null,
  })
  const openTaskCount =
    readyMissedCallAssistantIntakes.length +
    dueSequenceSteps.length +
    followUpsDue.length +
    newMissedCalls.length +
    newLeads.length
  const summaryText = bestSource
    ? `${business.leads.length} leads captured, ${capturedLeads.length} became customers, and ${bestSource.label} is the strongest source right now.`
    : `${business.leads.length} leads captured and ${capturedLeads.length} became customers so far.`

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1400px]">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-lr-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Snapshot mode
              </p>
              <h1 className="mt-2 text-3xl font-bold text-lr-strong">
                Snapshot for {business.name}
              </h1>
              <p className="mt-3 max-w-2xl text-lr-muted">{summaryText}</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
            >
              Full dashboard
            </Link>
          </div>

          <SnapshotPriorityCard action={priorityAction} />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/leads"
              className="rounded-2xl border border-lr-border p-5 hover:bg-lr-hover"
            >
              <p className="text-sm text-lr-subtle">Needs attention</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {openTaskCount}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                Open tasks
              </p>
            </Link>
            <Link
              href="/missed-calls"
              className="rounded-2xl border border-lr-border p-5 hover:bg-lr-hover"
            >
              <p className="text-sm text-lr-subtle">New missed calls</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {newMissedCalls.length}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                Open inbox
              </p>
            </Link>
            <Link
              href="/missed-calls"
              className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 hover:bg-indigo-100"
            >
              <p className="text-sm text-indigo-800">missed-call assistant intakes ready</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {missedCallAssistantStats.readyCount}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                {missedCallAssistantStats.inProgressCount} still chatting
              </p>
            </Link>
            <Link
              href="/leads"
              className="rounded-2xl border border-sky-200 bg-sky-50 p-5 hover:bg-sky-100"
            >
              <p className="text-sm text-sky-800">Sequence steps due</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {followUpSequenceStats.dueTodayCount}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                {followUpSequenceStats.activeSequenceCount} active sequence
                {followUpSequenceStats.activeSequenceCount === 1 ? "" : "s"}
              </p>
            </Link>
            <Link
              href="/dashboard#money-made"
              className="rounded-2xl border border-lr-border p-5 hover:bg-lr-hover"
            >
              <p className="text-sm text-lr-subtle">Money made</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {formatMoney(capturedRevenueCents)}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                View reporting
              </p>
            </Link>
            <Link
              href="/reviews"
              className="rounded-2xl border border-lr-border p-5 hover:bg-lr-hover"
            >
              <p className="text-sm text-lr-subtle">Reviews received</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {reviewFunnelStats.receivedCount}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                {reviewFunnelStats.requestRate}% requested
              </p>
            </Link>
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm text-lr-subtle">New leads</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {currentDayLeads.length}
              </p>
              <p className="mt-3 text-sm font-medium text-lr-body">
                Created today
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-lr-border p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-lr-subtle">
                    Follow-up list
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-lr-strong">
                    Who needs a response
                  </h2>
                </div>
                <Link
                  href="/leads"
                  className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
                >
                  Open Customers/Jobs
                </Link>
              </div>

              <div className="mt-5 divide-y divide-lr-border">
                {dueSequenceSteps.length === 0 &&
                followUpsDue.length === 0 &&
                newMissedCalls.length === 0 ? (
                  <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted">
                    No follow-ups or new missed calls are waiting.
                  </div>
                ) : (
                  <>
                    {dueSequenceSteps.slice(0, 4).map((step) => (
                      <Link
                        key={step.id}
                        href={`/leads/${step.lead.id}`}
                        className="grid gap-2 py-4 hover:bg-lr-hover sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-lr-strong">
                            {step.title}: {step.lead.customerName}
                          </p>
                          <p className="text-sm text-lr-muted">
                            {step.message}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-lr-subtle sm:text-right">
                          {formatSnapshotTime(step.dueAt)}
                        </p>
                      </Link>
                    ))}
                    {readyMissedCallAssistantIntakes.slice(0, 3).map((intake) => (
                      <Link
                        key={intake.id}
                        href={intake.leadId ? `/leads/${intake.leadId}` : "/missed-calls"}
                        className="grid gap-2 py-4 hover:bg-lr-hover sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-lr-strong">
                            missed-call assistant intake: {intake.missedCall.callerName}
                          </p>
                          <p className="text-sm text-lr-muted">
                            {intake.summary}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-lr-subtle sm:text-right">
                          Review
                        </p>
                      </Link>
                    ))}
                    {followUpsDue.slice(0, 4).map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="grid gap-2 py-4 hover:bg-lr-hover sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-lr-strong">
                            {lead.customerName}
                          </p>
                          <p className="text-sm text-lr-muted">
                            {lead.followUpNote || "Follow up with this lead."}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-lr-subtle sm:text-right">
                          {formatSnapshotTime(lead.followUpAt)}
                        </p>
                      </Link>
                    ))}
                    {newMissedCalls.slice(0, 3).map((call) => (
                      <Link
                        key={call.id}
                        href="/missed-calls"
                        className="grid gap-2 py-4 hover:bg-lr-hover sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-lr-strong">
                            {call.callerName}
                          </p>
                          <p className="text-sm text-lr-muted">
                            Missed call: {call.reason}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-lr-subtle sm:text-right">
                          Inbox
                        </p>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm font-medium text-lr-subtle">Quiet summary</p>
              <h2 className="mt-2 text-xl font-bold text-lr-strong">
                {openTaskCount === 0
                  ? "You are caught up"
                  : `${openTaskCount} item${openTaskCount === 1 ? "" : "s"} to handle`}
              </h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">Total money made</p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {formatMoney(capturedRevenueCents)}
                  </p>
                </div>
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">Best source</p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {bestSource?.label ?? "Not enough data"}
                  </p>
                  {bestSource && (
                    <p className="mt-1 text-sm text-lr-muted">
                      {bestSource.leadCount} leads,{" "}
                      {formatMoney(bestSource.revenueCents)} captured
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">Average reply time</p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {formatResponseDuration(responseStats.averageMinutes)}
                  </p>
                  <p className="mt-1 text-sm text-lr-muted">
                    {responseStats.waitingCount} waiting for reply
                  </p>
                </div>
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">
                    Follow-up sequences
                  </p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {followUpSequenceStats.completionRate}% handled
                  </p>
                  <p className="mt-1 text-sm text-lr-muted">
                    {followUpSequenceStats.dueTodayCount} due today,{" "}
                    {followUpSequenceStats.sentCount} sent
                  </p>
                </div>
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">LeadReply missed-call assistant</p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {missedCallAssistantStats.readyCount} ready
                  </p>
                  <p className="mt-1 text-sm text-lr-muted">
                    {missedCallAssistantStats.schedulingRequestedCount} need scheduling
                    , {missedCallAssistantStats.quoteRequestedCount} need quote review
                  </p>
                </div>
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">Review funnel</p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {reviewFunnelStats.requestedCapturedLeadCount}/
                    {reviewFunnelStats.capturedLeadCount}
                  </p>
                  <p className="mt-1 text-sm text-lr-muted">
                    {getReviewFunnelMessage(reviewFunnelStats)}
                  </p>
                </div>
                <div className="rounded-xl bg-lr-surface-muted p-4">
                  <p className="text-sm text-lr-subtle">Customers captured</p>
                  <p className="mt-1 text-2xl font-bold text-lr-strong">
                    {capturedLeads.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
