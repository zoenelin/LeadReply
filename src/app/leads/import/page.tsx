import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { AppNav } from "@/components/AppNav"
import { LeadImportForm } from "@/features/leads/LeadImportForm"

export const metadata: Metadata = {
  title: "Import Leads",
  description: "Import CRM leads into LeadReply from CSV.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LeadImportPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1400px]">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
          <Link
            href="/leads"
            className="text-sm font-medium text-lr-muted hover:text-lr-strong"
          >
            Back to Customers/Jobs
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Import
            </p>
            <h1 className="mt-2 text-3xl font-bold text-lr-strong">
              Import customers/jobs from CSV
            </h1>
            <p className="mt-3 max-w-2xl text-lr-muted">
              Bring existing customers, jobs, and leads into the CRM before
              launch or client onboarding.
            </p>
          </div>

          <LeadImportForm />
        </section>
      </div>
    </main>
  )
}
