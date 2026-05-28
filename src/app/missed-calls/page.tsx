import Link from "next/link"
import { authOptions } from "@/auth/auth"
import {
  normalizeConciergeAnswers,
  normalizeConciergeTranscript,
} from "@/lib/concierge-intake"
import { getStarterMissedCalls } from "@/lib/demo-data"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { AppNav } from "../components/AppNav"
import { MissedCallsInbox } from "./MissedCallsInbox"

const fallbackReply =
  "Thanks for calling. Sorry we missed you. How can we help?"

export default async function MissedCallsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      missedCalls: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          conciergeIntake: true,
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
        conciergeIntake: true,
      },
    })
  }

  const savedReplyTemplate = business.replyTemplate.trim()
  const replyTemplate =
    savedReplyTemplate.length > 0 ? savedReplyTemplate : fallbackReply

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 pb-28 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">
                Missed call inbox
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Review missed calls, choose a caller, and use your saved reply
                template to follow up quickly.
              </p>
            </div>

            <Link
              href="/settings/business"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
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
              conciergeIntake: call.conciergeIntake
                ? {
                    id: call.conciergeIntake.id,
                    status: call.conciergeIntake.status,
                    currentStep: call.conciergeIntake.currentStep,
                    intent: call.conciergeIntake.intent,
                    urgency: call.conciergeIntake.urgency,
                    preferredTime: call.conciergeIntake.preferredTime,
                    schedulingRequested:
                      call.conciergeIntake.schedulingRequested,
                    schedulingMode: call.conciergeIntake.schedulingMode,
                    quoteRequested: call.conciergeIntake.quoteRequested,
                    quoteGuidance: call.conciergeIntake.quoteGuidance,
                    summary: call.conciergeIntake.summary,
                    nextAction: call.conciergeIntake.nextAction,
                    transcript: normalizeConciergeTranscript(
                      call.conciergeIntake.transcript
                    ),
                    answers: normalizeConciergeAnswers(
                      call.conciergeIntake.answers
                    ),
                    leadId: call.conciergeIntake.leadId,
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
