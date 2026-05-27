import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../components/AppNav"
import { LeadPipeline } from "./LeadPipeline"

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      leads: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          reviewRequests: true,
        },
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Pipeline
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Lead pipeline
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Add leads, track their value, and keep follow-ups from slipping.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/intake/${business.id}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open intake form
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                View analytics
              </Link>
            </div>
          </div>

          <LeadPipeline
            leads={business.leads.map((lead) => ({
              ...lead,
              createdAt: lead.createdAt.toISOString(),
              closedAt: lead.closedAt?.toISOString() ?? null,
              followUpAt: lead.followUpAt?.toISOString() ?? null,
              followUpCompletedAt:
                lead.followUpCompletedAt?.toISOString() ?? null,
            }))}
          />
        </section>
      </div>
    </main>
  )
}
