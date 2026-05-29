import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { getBusinessHealthStats } from "@/lib/business-health"
import { getConciergeStats } from "@/lib/concierge-intake"
import { getAverageLeadValueCents } from "@/lib/demo-data"
import { getFollowUpSequenceStats } from "@/lib/follow-up-sequences"
import { leadSourceLabels, formatMoney } from "@/lib/lead-options"
import {
  getLostRevenueMessage,
  getLostRevenueStats,
} from "@/lib/lost-revenue"
import { prisma } from "@/lib/prisma"
import {
  formatResponseDuration,
  getResponseSpeedStats,
} from "@/lib/response-speed"
import {
  getReviewFunnelMessage,
  getReviewFunnelStats,
} from "@/lib/review-funnel"
import { buildRevenueSummaryRows } from "@/lib/reporting"
import { AppNav } from "../components/AppNav"

export const metadata: Metadata = {
  title: "Snapshot",
  description:
    "A simple owner snapshot for the most important LeadReply action right now.",
  robots: {
    index: false,
    follow: false,
  },
}

type PriorityAction = {
  label: string
  title: string
  description: string
  href: string
  buttonLabel: string
}

function formatTime(date: Date | null) {
  if (!date) {
    return "No time set"
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getPriorityAction({
  conciergeIntake,
  sequenceStep,
  followUp,
  missedCall,
  newLead,
}: {
  conciergeIntake:
    | {
        summary: string
        nextAction: string
        leadId: string | null
        missedCall: {
          callerName: string
          callerPhone: string
        }
      }
    | null
  sequenceStep:
    | {
        title: string
        message: string
        dueAt: Date | null
        lead: {
          id: string
          customerName: string
          estimatedValueCents: number
        }
      }
    | null
  followUp:
    | {
        id: string
        customerName: string
        customerPhone: string
        followUpAt: Date | null
        followUpNote: string
        estimatedValueCents: number
      }
    | null
  missedCall:
    | {
        callerName: string
        callerPhone: string
        reason: string
      }
    | null
  newLead:
    | {
        id: string
        customerName: string
        customerPhone: string
        source: string
        estimatedValueCents: number
      }
    | null
}): PriorityAction {
  if (conciergeIntake) {
    return {
      label: "Do this first",
      title: `Review AI intake for ${conciergeIntake.missedCall.callerName}`,
      description:
        conciergeIntake.nextAction ||
        conciergeIntake.summary ||
        `${conciergeIntake.missedCall.callerPhone} completed the missed-call intake.`,
      href: conciergeIntake.leadId
        ? `/leads/${conciergeIntake.leadId}`
        : "/missed-calls",
      buttonLabel: conciergeIntake.leadId ? "Open lead" : "Open inbox",
    }
  }

  if (sequenceStep) {
    return {
      label: "Do this first",
      title: `${sequenceStep.title} for ${sequenceStep.lead.customerName}`,
      description:
        sequenceStep.message ||
        `${sequenceStep.lead.customerName} is waiting on the next planned touch. Estimated value: ${formatMoney(
          sequenceStep.lead.estimatedValueCents
        )}.`,
      href: `/leads/${sequenceStep.lead.id}`,
      buttonLabel: "Open lead",
    }
  }

  if (followUp) {
    return {
      label: "Do this first",
      title: `Follow up with ${followUp.customerName}`,
      description:
        followUp.followUpNote ||
        `${followUp.customerName} is waiting on a follow-up. Estimated value: ${formatMoney(
          followUp.estimatedValueCents
        )}.`,
      href: `/leads/${followUp.id}`,
      buttonLabel: "Open lead",
    }
  }

  if (missedCall) {
    return {
      label: "Do this first",
      title: `Reply to ${missedCall.callerName}`,
      description: `${missedCall.callerPhone} called about: ${missedCall.reason}`,
      href: "/missed-calls",
      buttonLabel: "Open inbox",
    }
  }

  if (newLead) {
    return {
      label: "Do this first",
      title: `Review ${newLead.customerName}`,
      description: `${leadSourceLabels[newLead.source] ?? "This lead"} is worth an estimated ${formatMoney(
        newLead.estimatedValueCents
      )}.`,
      href: `/leads/${newLead.id}`,
      buttonLabel: "Open lead",
    }
  }

  return {
    label: "Caught up",
    title: "Nothing urgent needs attention",
    description:
      "No overdue follow-ups, new missed calls, or new leads are waiting right now.",
    href: "/leads",
    buttonLabel: "Review pipeline",
  }
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
      conciergeIntakes: {
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
        (lead.status === "NEW" || lead.status === "CONTACTED")
    )
    .sort(
      (left, right) =>
        (left.followUpAt?.getTime() ?? 0) - (right.followUpAt?.getTime() ?? 0)
    )
  const newMissedCalls = business.missedCalls.filter(
    (call) => call.status === "NEW"
  )
  const followUpSequenceStats = getFollowUpSequenceStats(
    business.followUpSteps
  )
  const conciergeStats = getConciergeStats(business.conciergeIntakes)
  const readyConciergeIntakes = business.conciergeIntakes.filter(
    (intake) => intake.status === "READY_FOR_OWNER"
  )
  const dueSequenceSteps = business.followUpSteps.filter(
    (step) =>
      step.status === "DRAFT" && step.dueAt && step.dueAt <= currentDayEnd
  )
  const newLeads = business.leads.filter((lead) => lead.status === "NEW")
  const currentDayLeads = business.leads.filter(
    (lead) =>
      lead.createdAt >= currentDayStart && lead.createdAt <= currentDayEnd
  )
  const capturedLeads = business.leads.filter(
    (lead) => lead.status === "CAPTURED"
  )
  const capturedRevenueCents = capturedLeads.reduce(
    (total, lead) => total + lead.capturedValueCents,
    0
  )
  const recoveredRevenueCents = capturedLeads
    .filter((lead) => lead.source === "MISSED_CALL")
    .reduce((total, lead) => total + lead.capturedValueCents, 0)
  const sourceRows = buildRevenueSummaryRows(business.leads)
  const responseStats = getResponseSpeedStats(business.missedCalls)
  const lostRevenueStats = getLostRevenueStats({
    leads: business.leads,
    missedCalls: business.missedCalls,
    missedCallValueCents: getAverageLeadValueCents(business.businessType),
  })
  const businessHealthStats = getBusinessHealthStats({
    business,
    leads: business.leads,
    missedCalls: business.missedCalls,
    reviewRequestCount: business._count.reviewRequests,
    missedCallValueCents: getAverageLeadValueCents(business.businessType),
  })
  const reviewFunnelStats = getReviewFunnelStats(business.leads)
  const bestSource = [...sourceRows]
    .filter((source) => source.leadCount > 0)
    .sort(
      (left, right) =>
        right.revenueCents - left.revenueCents ||
        right.leadCount - left.leadCount
    )[0]
  const priorityAction = getPriorityAction({
    conciergeIntake: readyConciergeIntakes[0] ?? null,
    sequenceStep: dueSequenceSteps[0] ?? null,
    followUp: followUpsDue[0] ?? null,
    missedCall: newMissedCalls[0] ?? null,
    newLead: newLeads[0] ?? null,
  })
  const openTaskCount =
    readyConciergeIntakes.length +
    dueSequenceSteps.length +
    followUpsDue.length +
    newMissedCalls.length +
    newLeads.length
  const summaryText = bestSource
    ? `${business.leads.length} leads captured, ${capturedLeads.length} became customers, and ${bestSource.label} is the strongest source right now.`
    : `${business.leads.length} leads captured and ${capturedLeads.length} became customers so far.`

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Snapshot mode
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Snapshot for {business.name}
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">{summaryText}</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Full dashboard
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              {priorityAction.label}
            </p>
            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-bold">{priorityAction.title}</h2>
                <p className="mt-3 max-w-2xl text-slate-200">
                  {priorityAction.description}
                </p>
              </div>
              <Link
                href={priorityAction.href}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                {priorityAction.buttonLabel}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={businessHealthStats.weakestFactor.href}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 hover:bg-emerald-100"
            >
              <p className="text-sm text-emerald-800">Business health</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {businessHealthStats.score}/100
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {businessHealthStats.label}
              </p>
            </Link>
            <Link
              href="/leads"
              className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
            >
              <p className="text-sm text-slate-500">Needs attention</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {openTaskCount}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Open tasks
              </p>
            </Link>
            <Link
              href="/missed-calls"
              className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
            >
              <p className="text-sm text-slate-500">New missed calls</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {newMissedCalls.length}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Open inbox
              </p>
            </Link>
            <Link
              href="/missed-calls"
              className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 hover:bg-indigo-100"
            >
              <p className="text-sm text-indigo-800">AI intakes ready</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {conciergeStats.readyCount}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {conciergeStats.inProgressCount} still chatting
              </p>
            </Link>
            <Link
              href="/leads"
              className="rounded-2xl border border-sky-200 bg-sky-50 p-5 hover:bg-sky-100"
            >
              <p className="text-sm text-sky-800">Sequence steps due</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {followUpSequenceStats.dueTodayCount}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {followUpSequenceStats.activeSequenceCount} active sequence
                {followUpSequenceStats.activeSequenceCount === 1 ? "" : "s"}
              </p>
            </Link>
            <Link
              href="/analytics"
              className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
            >
              <p className="text-sm text-slate-500">Money recovered</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatMoney(recoveredRevenueCents)}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Captured missed calls
              </p>
            </Link>
            <Link
              href="/analytics"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-5 hover:bg-rose-100"
            >
              <p className="text-sm text-rose-800">Money at risk</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatMoney(lostRevenueStats.totalAtRiskCents)}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Recover next
              </p>
            </Link>
            <Link
              href="/reviews"
              className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
            >
              <p className="text-sm text-slate-500">Reviews received</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {reviewFunnelStats.receivedCount}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {reviewFunnelStats.requestRate}% requested
              </p>
            </Link>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">New leads</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {currentDayLeads.length}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Created today
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Follow-up list
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Who needs a response
                  </h2>
                </div>
                <Link
                  href="/leads"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Open pipeline
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {dueSequenceSteps.length === 0 &&
                followUpsDue.length === 0 &&
                newMissedCalls.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No follow-ups or new missed calls are waiting.
                  </div>
                ) : (
                  <>
                    {dueSequenceSteps.slice(0, 4).map((step) => (
                      <Link
                        key={step.id}
                        href={`/leads/${step.lead.id}`}
                        className="grid gap-2 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {step.title}: {step.lead.customerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {step.message}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-500 sm:text-right">
                          {formatTime(step.dueAt)}
                        </p>
                      </Link>
                    ))}
                    {readyConciergeIntakes.slice(0, 3).map((intake) => (
                      <Link
                        key={intake.id}
                        href={intake.leadId ? `/leads/${intake.leadId}` : "/missed-calls"}
                        className="grid gap-2 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            AI intake: {intake.missedCall.callerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {intake.summary}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-500 sm:text-right">
                          Review
                        </p>
                      </Link>
                    ))}
                    {followUpsDue.slice(0, 4).map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="grid gap-2 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {lead.customerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {lead.followUpNote || "Follow up with this lead."}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-500 sm:text-right">
                          {formatTime(lead.followUpAt)}
                        </p>
                      </Link>
                    ))}
                    {newMissedCalls.slice(0, 3).map((call) => (
                      <Link
                        key={call.id}
                        href="/missed-calls"
                        className="grid gap-2 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_7rem]"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {call.callerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            Missed call: {call.reason}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-500 sm:text-right">
                          Inbox
                        </p>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">Quiet summary</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {openTaskCount === 0
                  ? "You are caught up"
                  : `${openTaskCount} item${openTaskCount === 1 ? "" : "s"} to handle`}
              </h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total money made</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatMoney(capturedRevenueCents)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Best source</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {bestSource?.label ?? "Not enough data"}
                  </p>
                  {bestSource && (
                    <p className="mt-1 text-sm text-slate-600">
                      {bestSource.leadCount} leads,{" "}
                      {formatMoney(bestSource.revenueCents)} captured
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Average reply time</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatResponseDuration(responseStats.averageMinutes)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {responseStats.waitingCount} waiting for reply
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Follow-up sequences
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {followUpSequenceStats.completionRate}% handled
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {followUpSequenceStats.dueTodayCount} due today,{" "}
                    {followUpSequenceStats.sentCount} sent
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">AI concierge</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {conciergeStats.readyCount} ready
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {conciergeStats.schedulingRequestedCount} need scheduling
                    , {conciergeStats.quoteRequestedCount} need quote review
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Business health</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {businessHealthStats.score}/100
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {businessHealthStats.message}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Lost revenue tracker</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatMoney(lostRevenueStats.totalLostAndAtRiskCents)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getLostRevenueMessage(lostRevenueStats)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Review funnel</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {reviewFunnelStats.requestedCapturedLeadCount}/
                    {reviewFunnelStats.capturedLeadCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getReviewFunnelMessage(reviewFunnelStats)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Customers captured</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
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
