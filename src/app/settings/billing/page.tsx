import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { planOptions } from "@/lib/business-options"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
import { BillingPlanForm } from "./BillingPlanForm"

export default async function BillingSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 pb-28 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Billing
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Plan selection
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Pricing is still coming soon, but the selected plan already
                controls the setup prompts LeadReply shows.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Billing status</p>
              <p className="mt-1 font-bold text-slate-950">
                {business.billingStatus === "MOCK_ACTIVE"
                  ? "Mock active"
                  : business.billingStatus}
              </p>
            </div>
          </div>

          <BillingPlanForm
            initialPlan={business.selectedPlan}
            plans={planOptions}
          />
        </section>
      </div>
    </main>
  )
}
