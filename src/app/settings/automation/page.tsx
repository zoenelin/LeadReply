import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { AutomationSettingsForm } from "@/features/core/AutomationSettingsForm"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Automation Setup",
  description:
    "Configure LeadReply phone, booking, quote, and review automation rules.",
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

  const access = await getBusinessAccessForSession(session, "manageAutomation")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  return (
    <SettingsShell>
      <section className="space-y-8">
        <h1 className="text-3xl font-bold text-lr-strong">
          Automation setup
        </h1>
        <p className="mt-3 text-lr-muted">
          Prepare phone, booking, quote, and review workflows before real
          integrations are connected.
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
    </SettingsShell>
  )
}
