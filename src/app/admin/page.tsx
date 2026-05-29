import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { AppNav } from "@/app/components/AppNav"
import { isAdminEmail } from "@/lib/admin"
import { getIntegrationStatuses } from "@/lib/integration-status"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Admin",
  description: "LeadReply launch admin tools and operational visibility.",
  robots: {
    index: false,
    follow: false,
  },
}

function statusClassName(ready: boolean) {
  return ready
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700"
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!isAdminEmail(session.user.email)) {
    notFound()
  }

  const [businesses, businessCount, userCount, leadCount, emailLogs] =
    await Promise.all([
    prisma.business.findMany({
      orderBy: {
        id: "desc",
      },
      take: 8,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            leads: true,
            missedCalls: true,
            teamMembers: true,
          },
        },
      },
    }),
    prisma.business.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.emailLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),
  ])
  const statuses = getIntegrationStatuses()

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Back to dashboard
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Launch operations
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Quick visibility into accounts, businesses, provider setup, and
              production email logs.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Users</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {userCount}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Businesses</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {businessCount}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Leads</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {leadCount}
              </p>
            </div>
          </div>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-xl font-bold text-slate-950">
                Recent businesses
              </h2>
              <div className="mt-5 space-y-3">
                {businesses.map((business) => (
                  <article
                    key={business.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          {business.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {business.user.email}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {business.selectedPlan}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {business._count.leads} leads,{" "}
                      {business._count.missedCalls} missed calls,{" "}
                      {business._count.teamMembers} teammates
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-950">
                  Provider status
                </h2>
                <div className="mt-5 space-y-3">
                  {statuses.map((status) => (
                    <div
                      key={status.key}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-950">
                          {status.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {status.summary}
                        </p>
                      </div>
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                          status.configured
                        )}`}
                      >
                        {status.configured ? "Ready" : "Needs setup"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-950">
                  Email logs
                </h2>
                <div className="mt-5 space-y-3">
                  {emailLogs.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No production email attempts yet.
                    </p>
                  ) : (
                    emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <p className="font-bold text-slate-950">
                          {log.subject}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {log.to} - {log.status}
                        </p>
                        {log.error && (
                          <p className="mt-1 text-sm text-rose-700">
                            {log.error}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
