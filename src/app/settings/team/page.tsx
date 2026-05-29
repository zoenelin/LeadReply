import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { TeamSettingsForm } from "./TeamSettingsForm"

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

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
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
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Team
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Staff permissions
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Keep track of managers, staff, and viewer access before full
              staff login support is connected.
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
      </div>
    </main>
  )
}
