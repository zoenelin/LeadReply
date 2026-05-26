import Link from "next/link"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { AppNav } from "../components/AppNav"
import { MissedCallsInbox } from "./MissedCallsInbox"

const fallbackReply =
  "Thanks for calling. Sorry we missed you. How can we help?"

const seedCallsByType = {
  AUTOMOTIVE: [
    {
      callerName: "Jamie Parker",
      callerPhone: "(555) 214-9021",
      reason: "Asked about a brake inspection and same-week availability.",
    },
    {
      callerName: "Morgan Lee",
      callerPhone: "(555) 782-1140",
      reason: "Wanted an estimate for engine diagnostics.",
    },
    {
      callerName: "Taylor Smith",
      callerPhone: "(555) 640-3318",
      reason: "Called about oil change pricing and drop-off times.",
    },
  ],
  HOME_SERVICES: [
    {
      callerName: "Jamie Parker",
      callerPhone: "(555) 214-9021",
      reason: "Asked about a same-week estimate for a leaking sink.",
    },
    {
      callerName: "Morgan Lee",
      callerPhone: "(555) 782-1140",
      reason: "Wanted availability for a small repair before Friday.",
    },
    {
      callerName: "Taylor Smith",
      callerPhone: "(555) 640-3318",
      reason: "Called about service area and pricing for a new job.",
    },
  ],
  BEAUTY_SERVICES: [
    {
      callerName: "Ari Johnson",
      callerPhone: "(555) 418-2904",
      reason: "Asked about openings for a haircut this afternoon.",
    },
    {
      callerName: "Casey Nguyen",
      callerPhone: "(555) 906-4412",
      reason: "Wanted pricing and availability for a full set.",
    },
    {
      callerName: "Riley Carter",
      callerPhone: "(555) 335-7729",
      reason: "Called to ask if walk-ins are available today.",
    },
  ],
  FOOD_SERVICES: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about catering for a lunch order tomorrow.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to confirm reservation availability for six people.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about pickup timing and menu options.",
    },
  ],
  MEDICAL_WELLNESS: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about appointment availability for next week.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to ask about services and insurance questions.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about consultation availability.",
    },
  ],
  LEGAL: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about scheduling an initial consultation.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to know if the firm handles their case type.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about fees and appointment availability.",
    },
  ],
  FITNESS: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about membership options and trial classes.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted personal training availability.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about class schedules.",
    },
  ],
  REAL_ESTATE: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about scheduling a property showing.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted information about selling their home.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about rental availability.",
    },
  ],
  PROFESSIONAL_SERVICES: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about booking a consultation.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to understand service pricing.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about project availability.",
    },
  ],
  RETAIL: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about product availability.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted pickup timing for an order.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about store hours and special orders.",
    },
  ],
}

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
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  let missedCalls = business.missedCalls

  if (missedCalls.length === 0) {
    const seedCalls =
      seedCallsByType[business.businessType as keyof typeof seedCallsByType] ??
      seedCallsByType.PROFESSIONAL_SERVICES

    await prisma.missedCall.createMany({
      data: seedCalls.map((call) => ({
        ...call,
        businessId: business.id,
      })),
    })

    missedCalls = await prisma.missedCall.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: "desc",
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
              reason: call.reason,
              status: call.status,
            }))}
            replyTemplate={replyTemplate}
          />
        </section>
      </div>
    </main>
  )
}
