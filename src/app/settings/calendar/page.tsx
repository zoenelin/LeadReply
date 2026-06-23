import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { CalendarSettingsForm } from "@/features/core/CalendarSettingsForm"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Calendar",
  description: "Configure LeadReply calendar and booking preferences.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CalendarSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "manageAppointments")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    select: {
      calendarProvider: true,
      calendarBookingUrl: true,
      calendarSyncNotes: true,
      autoSchedulingEnabled: true,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  return (
    <SettingsShell>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Calendar
          </p>
          <h1 className="mt-2 text-3xl font-bold text-lr-strong">
            Booking and scheduling setup
          </h1>
          <p className="mt-3 max-w-2xl text-lr-muted">
            Store the calendar provider, booking link, and scheduling rules
            LeadReply will use for future self-scheduling integrations.
          </p>
        </div>

        <CalendarSettingsForm business={business} />
      </section>
    </SettingsShell>
  )
}
