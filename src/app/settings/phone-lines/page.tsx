import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { SettingsShell } from "@/components/SettingsShell"
import { prisma } from "@/lib/data/prisma"
import {
  getPhoneLineLimit,
  getRoutingTargetLimit,
} from "@/services/communications/phone-lines"
import { getBusinessAccessForSession } from "@/services/auth/business-access"
import { PhoneLineSettingsForm } from "./PhoneLineSettingsForm"

export const metadata: Metadata = {
  title: "Phone Lines",
  description: "Manage LeadReply phone lines and routing targets.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PhoneLinesSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "managePhoneLines")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    select: {
      phone: true,
      selectedPlan: true,
      phoneLines: {
        orderBy: [
          {
            active: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        include: {
          routeTargets: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
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
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Phone routing
            </p>
            <h1 className="mt-2 text-3xl font-bold text-lr-strong">
              Phone lines
            </h1>
            <p className="mt-3 max-w-2xl text-lr-muted">
              Track each LeadReply number, where it forwards, and which line a
                missed call came through. Basic starts with one line; upgraded
              plans can try extra fallback phones before sending the automatic
              text.
            </p>
          </div>
          <div className="rounded-2xl bg-lr-surface-muted px-4 py-3 text-sm font-semibold text-lr-body">
            {business.phoneLines.length}/{getPhoneLineLimit(business.selectedPlan)}{" "}
            configured
          </div>
        </div>

        <PhoneLineSettingsForm
          defaultRoutingTarget={business.phone}
          lineLimit={getPhoneLineLimit(business.selectedPlan)}
          routeTargetLimit={getRoutingTargetLimit(business.selectedPlan)}
          phoneLines={business.phoneLines.map((line) => ({
            id: line.id,
            label: line.label,
            phoneNumber: line.phoneNumber,
            provider: line.provider,
            providerLineId: line.providerLineId,
            routingTarget: line.routingTarget,
            routeTargets: line.routeTargets.map((target) => ({
              id: target.id,
              label: target.label,
              phoneNumber: target.phoneNumber,
              sortOrder: target.sortOrder,
              active: target.active,
            })),
            routingStrategy: line.routingStrategy,
            planRequired: line.planRequired,
            active: line.active,
            notes: line.notes,
          }))}
          selectedPlan={business.selectedPlan}
        />
      </section>
    </SettingsShell>
  )
}
