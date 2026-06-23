import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { TeamSettingsForm } from "./TeamSettingsForm"
import { getOwnerBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Team",
  description: "Manage LeadReply team access and staff permissions.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function TeamSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getOwnerBusinessAccessForSession(session)

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    select: {
      teamMembers: {
        orderBy: {
          createdAt: "desc",
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
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Team
          </p>
          <h1 className="mt-2 text-3xl font-bold text-lr-strong">
            Staff permissions
          </h1>
          <p className="mt-3 max-w-2xl text-lr-muted">
            Keep track of managers, staff, and viewer access before full staff
            login support is connected.
          </p>
        </div>

        <TeamSettingsForm
          members={business.teamMembers.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            status: member.status,
          }))}
        />
      </section>
    </SettingsShell>
  )
}
