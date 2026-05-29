import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { CalendarSettingsForm } from "./CalendarSettingsForm"

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

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Back to dashboard
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Calendar
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Booking and scheduling setup
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Store the calendar provider, booking link, and scheduling rules
              LeadReply will use for future self-scheduling integrations.
            </p>
          </div>

          <CalendarSettingsForm business={business} />
        </section>
      </div>
    </main>
  )
}
