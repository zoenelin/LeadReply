import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { ServiceCatalogForm } from "@/features/core/ServiceCatalogForm"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

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

  const access = await getBusinessAccessForSession(session, "manageLeads")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
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
    <SettingsShell>
      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Services and availability
            </p>
            <h1 className="mt-2 text-3xl font-bold text-lr-strong">
              Service catalog
            </h1>
            <p className="mt-3 max-w-2xl text-lr-muted">
              Define what the business offers, how estimates should be bounded,
              and when customers can request appointments.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/settings/automation"
              className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
            >
              Automation
            </Link>
            <Link
              href="/settings/business"
              className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
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
    </SettingsShell>
  )
}
