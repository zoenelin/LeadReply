import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { ServiceCatalogForm } from "./ServiceCatalogForm"

export const metadata: Metadata = {
  title: "Services And Availability",
  description: "Configure LeadReply service catalog, quote ranges, and availability windows.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ServicesSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      serviceOfferings: {
        orderBy: [
          {
            displayOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
      availabilityWindows: {
        orderBy: [
          {
            dayOfWeek: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      },
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

          <div className="mt-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
                Services and availability
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Service catalog
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Define what the business offers, how estimates should be
                bounded, and when customers can request appointments.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/settings/automation"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Automation
              </Link>
              <Link
                href="/settings/business"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Business
              </Link>
            </div>
          </div>

          <ServiceCatalogForm
            services={business.serviceOfferings.map((service) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              category: service.category,
              estimateLowCents: service.estimateLowCents,
              estimateHighCents: service.estimateHighCents,
              durationMinutes: service.durationMinutes,
              bookableOnline: service.bookableOnline,
              ownerConfirmRequired: service.ownerConfirmRequired,
              active: service.active,
              displayOrder: service.displayOrder,
            }))}
            availabilityWindows={business.availabilityWindows.map((window) => ({
              id: window.id,
              dayOfWeek: window.dayOfWeek,
              startTime: window.startTime,
              endTime: window.endTime,
              minimumNoticeHours: window.minimumNoticeHours,
              active: window.active,
            }))}
          />
        </section>
      </div>
    </main>
  )
}
