import type { Metadata } from "next"
import Link from "next/link"
import { authOptions } from "@/auth/auth"
import {
  normalizeMissedCallAssistantAnswers,
  normalizeMissedCallAssistantTranscript,
} from "@/services/modules/core"
import { getStarterMissedCalls } from "@/lib/data/demo-data"
import { prisma } from "@/lib/data/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { AppNav } from "@/components/AppNav"
import { MissedCallsInbox } from "@/features/core/MissedCallsInbox"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Missed Call Inbox",
  description: "Review missed calls and automatic LeadReply missed-call assistant texts.",
  robots: {
    index: false,
    follow: false,
  },
}

const fallbackReply =
  "Thanks for calling. Sorry we missed you. How can we help?"

export default async function MissedCallsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "manageMessages")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    include: {
      missedCalls: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          missedCallAssistantIntake: true,
          smsMessages: {
            orderBy: {
              createdAt: "asc",
            },
          },
          routingAttempts: {
            orderBy: {
              routeOrder: "asc",
            },
          },
        },
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  let missedCalls = business.missedCalls

  if (missedCalls.length === 0) {
    await prisma.missedCall.createMany({
      data: getStarterMissedCalls(business.id, business.businessType),
    })

    missedCalls = await prisma.missedCall.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        missedCallAssistantIntake: true,
        smsMessages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        routingAttempts: {
          orderBy: {
            routeOrder: "asc",
          },
        },
      },
    })
  }

  const savedReplyTemplate = business.replyTemplate.trim()
  const replyTemplate =
    savedReplyTemplate.length > 0 ? savedReplyTemplate : fallbackReply

  return (
    <main className="min-h-screen bg-lr-page px-3 py-4 pb-8 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />

        <section className="mt-4 rounded-2xl bg-lr-surface p-4 shadow-sm sm:p-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-lr-muted hover:text-lr-strong"
          >
            Back to dashboard
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold text-lr-strong">
                Missed call inbox
              </h1>
              <p className="mt-3 max-w-2xl text-lr-muted">
                Review missed calls, automatic text-back activity, customer
                replies, and LeadReply missed-call assistant summaries.
              </p>
            </div>

            <Link
              href="/settings/business"
              className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
            >
              Edit reply template
            </Link>
          </div>

          <MissedCallsInbox
            calls={missedCalls.map((call) => ({
              id: call.id,
              callerName: call.callerName,
              callerPhone: call.callerPhone,
              createdAt: call.createdAt.toISOString(),
              repliedAt: call.repliedAt?.toISOString() ?? null,
              reason: call.reason,
              status: call.status,
              convertedLeadId: call.convertedLeadId,
              smsMessages: call.smsMessages.map((message) => ({
                id: message.id,
                direction: message.direction,
                status: message.status,
                providerMessageId: message.providerMessageId,
                body: message.body,
                purpose: message.purpose,
                error: message.error,
                createdAt: message.createdAt.toISOString(),
                sentAt: message.sentAt?.toISOString() ?? null,
                deliveredAt: message.deliveredAt?.toISOString() ?? null,
                failedAt: message.failedAt?.toISOString() ?? null,
                receivedAt: message.receivedAt?.toISOString() ?? null,
              })),
              routingAttempts: call.routingAttempts.map((attempt) => ({
                id: attempt.id,
                routedToPhoneNumber: attempt.routedToPhoneNumber,
                routeLabel: attempt.routeLabel,
                routeOrder: attempt.routeOrder,
                status: attempt.status,
                completedAt: attempt.completedAt?.toISOString() ?? null,
              })),
              missedCallAssistantIntake: call.missedCallAssistantIntake
                ? {
                    id: call.missedCallAssistantIntake.id,
                    status: call.missedCallAssistantIntake.status,
                    currentStep: call.missedCallAssistantIntake.currentStep,
                    intent: call.missedCallAssistantIntake.intent,
                    urgency: call.missedCallAssistantIntake.urgency,
                    preferredTime: call.missedCallAssistantIntake.preferredTime,
                    schedulingRequested:
                      call.missedCallAssistantIntake.schedulingRequested,
                    schedulingMode: call.missedCallAssistantIntake.schedulingMode,
                    quoteRequested: call.missedCallAssistantIntake.quoteRequested,
                    quoteGuidance: call.missedCallAssistantIntake.quoteGuidance,
                    matchedServiceName:
                      call.missedCallAssistantIntake.matchedServiceName,
                    matchedQuoteLowCents:
                      call.missedCallAssistantIntake.matchedQuoteLowCents,
                    matchedQuoteHighCents:
                      call.missedCallAssistantIntake.matchedQuoteHighCents,
                    matchedDurationMinutes:
                      call.missedCallAssistantIntake.matchedDurationMinutes,
                    serviceBookableOnline:
                      call.missedCallAssistantIntake.serviceBookableOnline,
                    availabilityGuidance:
                      call.missedCallAssistantIntake.availabilityGuidance,
                    summary: call.missedCallAssistantIntake.summary,
                    nextAction: call.missedCallAssistantIntake.nextAction,
                    transcript: normalizeMissedCallAssistantTranscript(
                      call.missedCallAssistantIntake.transcript
                    ),
                    answers: normalizeMissedCallAssistantAnswers(
                      call.missedCallAssistantIntake.answers
                    ),
                    aiProvider: call.missedCallAssistantIntake.aiProvider,
                    aiModel: call.missedCallAssistantIntake.aiModel,
                    aiError: call.missedCallAssistantIntake.aiError,
                    leadId: call.missedCallAssistantIntake.leadId,
                  }
                : null,
            }))}
            replyTemplate={replyTemplate}
            businessName={business.name}
            businessType={business.businessType}
            bookingAutomationEnabled={business.bookingAutomationEnabled}
          />
        </section>
      </div>
    </main>
  )
}
