import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { AutomationSettingsForm } from "./AutomationSettingsForm"

export const metadata: Metadata = {
  title: "Automation Setup",
  description: "Configure LeadReply phone, booking, quote, review, SEO, and marketing guard rails.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AutomationSettingsPage() {
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 pb-28 md:pb-8">
      <div className="mx-auto max-w-4xl">
        <AppNav />
      </div>

      <section className="mx-auto mt-8 max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          Back to dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-slate-950">
          Automation setup
        </h1>
        <p className="mt-3 text-slate-600">
          Prepare phone, booking, review, SEO, and marketing workflows before
          real integrations are connected.
        </p>

        <AutomationSettingsForm
          initialSettings={{
            phoneAutomationEnabled: business.phoneAutomationEnabled,
            bookingAutomationEnabled: business.bookingAutomationEnabled,
            autoSchedulingEnabled: business.autoSchedulingEnabled,
            quoteEstimateEnabled: business.quoteEstimateEnabled,
            quoteRules: business.quoteRules,
            quoteDisclaimer: business.quoteDisclaimer,
            callbackTimeframe: business.callbackTimeframe,
            reviewAutomationEnabled: business.reviewAutomationEnabled,
            preferredContactMethod: business.preferredContactMethod,
            bookingNotes: business.bookingNotes,
            seoSetupNotes: business.seoSetupNotes,
            marketingSetupNotes: business.marketingSetupNotes,
            googleReviewUrl: business.googleReviewUrl,
            googleBusinessProfileUrl: business.googleBusinessProfileUrl,
            launchNotes: business.launchNotes,
          }}
        />
      </section>
    </main>
  )
}
