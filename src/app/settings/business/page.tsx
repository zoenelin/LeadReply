import type { Metadata } from "next"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { SettingsShell } from "@/components/SettingsShell"
import { BusinessSettingsForm } from "./BusinessSettingsForm"
import {
  getBusinessAccessForSession,
  hasBusinessCapability,
} from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Business Settings",
  description: "Update the LeadReply business profile, plan, and reply template.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function BusinessSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(
    session,
    "manageBusinessProfile"
  )

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
  })

  return (
    <SettingsShell>
      <section className="space-y-8">
        <h1 className="text-3xl font-bold">Business settings</h1>
        <p className="mt-3 text-lr-muted">
          Update the details LeadReply uses to tailor your dashboard and future
          replies.
        </p>

        <BusinessSettingsForm
          canManageBilling={hasBusinessCapability(access, "manageBilling")}
          initialBusiness={{
            name: business?.name ?? "",
            phone: business?.phone ?? "",
            contactName: business?.contactName ?? "",
            contactPhonePrimary: business?.contactPhonePrimary ?? "",
            contactPhoneSecondary: business?.contactPhoneSecondary ?? "",
            website: business?.website ?? "",
            address: business?.address ?? "",
            city: business?.city ?? "",
            state: business?.state ?? "",
            zip: business?.zip ?? "",
            businessType: business?.businessType ?? "HOME_SERVICES",
            selectedPlan: business?.selectedPlan ?? "BASIC",
            bookingNotes: business?.bookingNotes ?? "",
            replyTemplate: business?.replyTemplate ?? "",
          }}
        />
      </section>
    </SettingsShell>
  )
}
