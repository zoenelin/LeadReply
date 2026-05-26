import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import {
  businessCategoryLabels,
  planLabels,
  planOptions,
} from "@/lib/business-options"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AppNav } from "../components/AppNav"

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
  AUTOMOTIVE: {
    headline: "Turn missed service calls into booked appointments.",
    description:
      "Use LeadReply to follow up when drivers ask about repairs, inspections, estimates, or availability.",
    missedCallExample: "New service request",
    replyExample:
      "Thanks for calling. What vehicle do you need help with, and what service are you looking for?",
    reviewPrompt: "Ask customers for a review after a completed repair.",
  },
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
  MEDICAL_WELLNESS: {
    headline: "Help patients and clients get a quick response.",
    description:
      "Use LeadReply to follow up when someone asks about appointments, services, insurance, or availability.",
    missedCallExample: "New appointment question",
    replyExample:
      "Thanks for calling. What type of appointment are you looking for, and what day works best?",
    reviewPrompt: "Ask satisfied clients for a review after their visit.",
  },
  LEGAL: {
    headline: "Capture consultation requests before they go cold.",
    description:
      "Use LeadReply to respond when someone calls about consultations, case fit, fees, or availability.",
    missedCallExample: "New consultation request",
    replyExample:
      "Thanks for calling. What kind of legal help are you looking for, and what is the best time to reach you?",
    reviewPrompt: "Ask clients for a review after a successful matter closes.",
  },
  FITNESS: {
    headline: "Convert class and membership questions into signups.",
    description:
      "Use LeadReply to follow up when people ask about memberships, classes, trials, or personal training.",
    missedCallExample: "New membership question",
    replyExample:
      "Thanks for calling. Are you interested in classes, training, or membership options?",
    reviewPrompt: "Ask members for a review after a positive milestone.",
  },
  REAL_ESTATE: {
    headline: "Reply quickly to buyers, sellers, and rental leads.",
    description:
      "Use LeadReply to follow up when someone asks about listings, showings, valuations, or availability.",
    missedCallExample: "New property lead",
    replyExample:
      "Thanks for calling. Are you looking to buy, sell, rent, or schedule a showing?",
    reviewPrompt: "Ask clients for a review after closing or move-in.",
  },
  PROFESSIONAL_SERVICES: {
    headline: "Turn missed calls into scheduled consultations.",
    description:
      "Use LeadReply to follow up when prospects ask about services, pricing, consultations, or timelines.",
    missedCallExample: "New consultation request",
    replyExample:
      "Thanks for calling. What service are you looking for, and what is the best time to connect?",
    reviewPrompt: "Ask clients for a review after a successful project.",
  },
  RETAIL: {
    headline: "Keep product questions and store calls moving.",
    description:
      "Use LeadReply to respond when shoppers ask about inventory, hours, pickups, or special orders.",
    missedCallExample: "New shopper question",
    replyExample:
      "Thanks for calling. Are you asking about inventory, store hours, or an order?",
    reviewPrompt: "Ask shoppers for a review after a positive purchase.",
  },
  OTHER: {
    headline: "Capture missed calls and guide customers to the next step.",
    description:
      "Use LeadReply to follow up with callers, answer common questions, and request reviews after good experiences.",
    missedCallExample: "New lead",
    replyExample:
      "Thanks for calling. How can we help, and what is the best time to reach you?",
    reviewPrompt: "Ask satisfied customers for a review after a good experience.",
  },
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatMoney(cents: number) {
  return currencyFormatter.format(cents / 100)
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
          leads: true,
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
  const leadAnalytics = business
    ? await prisma.lead.aggregate({
        where: {
          businessId: business.id,
        },
        _sum: {
          wonValueCents: true,
        },
      })
    : null
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const followUpsDue = business
    ? await prisma.lead.findMany({
        where: {
          businessId: business.id,
          followUpAt: {
            lte: todayEnd,
          },
          followUpCompletedAt: null,
          status: {
            in: ["NEW", "CONTACTED"],
          },
        },
        orderBy: {
          followUpAt: "asc",
        },
        take: 4,
      })
    : []
  const reviewRequestsCount = business
    ? await prisma.reviewRequest.count({
        where: {
          businessId: business.id,
        },
      })
    : 0
  const revenueWonCents = leadAnalytics?._sum.wonValueCents ?? 0

  const dashboardContent =
    businessTypeContent[business?.businessType ?? ""] ??
    businessTypeContent.OTHER
  const savedReplyTemplate = business?.replyTemplate.trim()
  const replyTemplate =
    savedReplyTemplate && savedReplyTemplate.length > 0
      ? savedReplyTemplate
      : dashboardContent.replyExample
  const selectedPlan = business?.selectedPlan ?? "BASIC"
  const selectedPlanDetails =
    planOptions.find((plan) => plan.value === selectedPlan) ?? planOptions[0]
  const setupItems = [
    {
      label: "Business profile",
      complete: Boolean(
        business?.name &&
          business.phone &&
          business.address &&
          business.city &&
          business.state &&
          business.zip
      ),
    },
    {
      label: "Reply template",
      complete: Boolean(savedReplyTemplate),
    },
    {
      label: "Review request plan",
      complete: reviewRequestsCount > 0,
    },
    {
      label: "Lead pipeline",
      complete: Boolean((business?._count.leads ?? 0) > 0),
    },
    {
      label: "SEO setup prompts",
      complete: selectedPlan === "GROWTH" || selectedPlan === "COMPLETE",
    },
    {
      label: "Marketing setup prompts",
      complete: selectedPlan === "COMPLETE",
    },
  ]
  const completedSetupItems = setupItems.filter((item) => item.complete).length

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 pb-28 md:pb-8">
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
            <p className="mt-1 text-sm text-slate-600">
              {business.city}, {business.state} {business.zip}
            </p>
            <p className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {businessCategoryLabels[business.businessType] ?? "Business"}
            </p>
            <p className="mt-3 ms-2 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {planLabels[business.selectedPlan] ?? "Basic"} plan
            </p>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Setup progress
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {completedSetupItems} of {setupItems.length} steps ready
              </h2>
            </div>
            <Link
              href="/settings/automation"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Finish setup
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {setupItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {item.label}
                </span>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    item.complete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.complete ? "Ready" : "Next"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <Link
            href="/leads"
            className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
          >
            <p className="text-sm text-slate-500">Leads captured</p>
            <p className="mt-2 text-3xl font-bold">
              {business?._count.leads ?? 0}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              View graphs
            </p>
          </Link>

          <Link
            href="/analytics"
            className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
          >
            <p className="text-sm text-slate-500">Money made</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(revenueWonCents)}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Track revenue
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Texts sent</p>
            <p className="mt-2 text-3xl font-bold">{repliedCalls}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Follow-ups due today
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {followUpsDue.length} lead
                {followUpsDue.length === 1 ? "" : "s"} need attention
              </h2>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open pipeline
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {followUpsDue.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No follow-ups due today.
              </div>
            ) : (
              followUpsDue.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {lead.customerName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {lead.followUpNote || "Follow up with this lead."}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {lead.customerPhone}
                    </p>
                  </div>
                </Link>
              ))
            )}
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
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {reviewRequestsCount} request
              {reviewRequestsCount === 1 ? "" : "s"} tracked
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(selectedPlan === "GROWTH" || selectedPlan === "COMPLETE") && (
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                SEO setup prompts
              </p>
              <p className="mt-3 text-slate-800">
                Start with business hours, service areas, website basics, and
                local search profile details.
              </p>
            </div>
          )}

          {selectedPlan === "COMPLETE" && (
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Marketing setup prompts
              </p>
              <p className="mt-3 text-slate-800">
                Plan your social media presence, weekly content ideas, and
                seasonal promotions.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">
              Current package
            </p>
            <p className="mt-2 text-xl font-bold text-slate-950">
              {selectedPlanDetails.label}
            </p>
            <p className="mt-2 text-slate-700">{selectedPlanDetails.tagline}</p>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Pricing coming soon
            </p>
            <Link
              href="/settings/billing"
              className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Manage plan
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
