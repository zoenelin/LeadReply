import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { planLabels } from "@/lib/business-options"
import { getGrowthReadinessStats } from "@/lib/growth-readiness"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { GrowthSettingsForm } from "./GrowthSettingsForm"

export const metadata: Metadata = {
  title: "Growth Setup",
  description:
    "Configure LeadReply SEO and marketing setup for business growth plans.",
  robots: {
    index: false,
    follow: false,
  },
}

function statusClassName(ready: boolean) {
  return ready
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700"
}

export default async function GrowthSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const growthStats = getGrowthReadinessStats(business)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Growth setup
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                SEO and marketing
              </h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Collect the business details LeadReply needs for local SEO,
                Google profile optimization, social content, and campaign
                planning.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {planLabels[business.selectedPlan] ?? "Basic"} plan
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">SEO readiness</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {growthStats.seoReadyCount}/{growthStats.seoTotalCount}
                  </p>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                    growthStats.seoComplete
                  )}`}
                >
                  {growthStats.seoComplete ? "Ready" : "Needs setup"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Included with Growth and Complete plans.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Marketing readiness</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {growthStats.marketingReadyCount}/
                    {growthStats.marketingTotalCount}
                  </p>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                    growthStats.marketingComplete
                  )}`}
                >
                  {growthStats.marketingComplete ? "Ready" : "Needs setup"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Included with the Complete plan.
              </p>
            </div>
          </div>

          <GrowthSettingsForm
            initialSettings={{
              seoSetupNotes: business.seoSetupNotes,
              seoPrimaryServices: business.seoPrimaryServices,
              seoServiceAreas: business.seoServiceAreas,
              seoTargetKeywords: business.seoTargetKeywords,
              seoCompetitors: business.seoCompetitors,
              seoWebsitePages: business.seoWebsitePages,
              seoContentIdeas: business.seoContentIdeas,
              marketingSetupNotes: business.marketingSetupNotes,
              marketingChannels: business.marketingChannels,
              marketingAudience: business.marketingAudience,
              marketingGoals: business.marketingGoals,
              marketingOffer: business.marketingOffer,
              marketingContentThemes: business.marketingContentThemes,
              marketingPostingCadence: business.marketingPostingCadence,
              marketingBrandVoice: business.marketingBrandVoice,
            }}
          />
        </section>
      </div>
    </main>
  )
}
