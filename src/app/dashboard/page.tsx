import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AppNav } from "../components/AppNav"

const businessTypeLabels: Record<string, string> = {
  HOME_SERVICES: "Home services",
  BEAUTY_SERVICES: "Beauty services",
  FOOD_SERVICES: "Food and restaurants",
}

const businessTypeContent: Record<
  string,
  {
    headline: string
    description: string
    missedCallExample: string
    replyExample: string
    reviewPrompt: string
  }
> = {
  HOME_SERVICES: {
    headline: "Recover calls from homeowners who need help fast.",
    description:
      "Use LeadReply to follow up when someone calls about repairs, estimates, emergency work, or scheduling.",
    missedCallExample: "New estimate request",
    replyExample:
      "Thanks for calling. What service do you need help with, and what ZIP code are you in?",
    reviewPrompt: "Ask completed jobs for a Google review after the visit.",
  },
  BEAUTY_SERVICES: {
    headline: "Turn missed appointment calls into booked clients.",
    description:
      "Use LeadReply to reply when someone asks about openings, services, pricing, or last-minute availability.",
    missedCallExample: "New appointment request",
    replyExample:
      "Thanks for calling. What service are you looking for, and what day works best?",
    reviewPrompt: "Ask happy clients for a review after their appointment.",
  },
  FOOD_SERVICES: {
    headline: "Keep food orders, reservations, and questions moving.",
    description:
      "Use LeadReply to respond when guests call about hours, reservations, catering, pickup, or large orders.",
    missedCallExample: "New reservation or order question",
    replyExample:
      "Thanks for calling. Are you asking about a reservation, catering, or a pickup order?",
    reviewPrompt: "Ask guests for a review after a great meal or pickup.",
  },
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          missedCalls: true,
        },
      },
    },
  })
  const repliedCalls = business
    ? await prisma.missedCall.count({
        where: {
          businessId: business.id,
          status: "REPLIED",
        },
      })
    : 0

  const dashboardContent =
    businessTypeContent[business?.businessType ?? ""] ??
    businessTypeContent.HOME_SERVICES
  const savedReplyTemplate = business?.replyTemplate.trim()
  const replyTemplate =
    savedReplyTemplate && savedReplyTemplate.length > 0
      ? savedReplyTemplate
      : dashboardContent.replyExample

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <AppNav />
      </div>

      <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-3 text-slate-600">
          Logged in as {session.user.email}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-medium text-slate-500">
            Recommended workflow
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            {dashboardContent.headline}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-700">
            {dashboardContent.description}
          </p>
        </div>

        {business && (
          <div className="mt-6 rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-slate-500">Business profile</p>
              <Link
                href="/settings/business"
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                Edit
              </Link>
            </div>
            <p className="mt-2 text-xl font-bold">{business.name}</p>
            <p className="mt-1 text-sm text-slate-600">{business.phone}</p>
            <p className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {businessTypeLabels[business.businessType] ?? "Business"}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/missed-calls"
            className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
          >
            <p className="text-sm text-slate-500">
              {dashboardContent.missedCallExample}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {business?._count.missedCalls ?? 0}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Open inbox
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Texts sent</p>
            <p className="mt-2 text-3xl font-bold">{repliedCalls}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Review requests</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">
              {savedReplyTemplate ? "Saved text reply" : "Suggested text reply"}
            </p>
            <p className="mt-3 text-slate-800">{replyTemplate}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">
              Review request plan
            </p>
            <p className="mt-3 text-slate-800">
              {dashboardContent.reviewPrompt}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
