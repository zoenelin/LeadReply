import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { planOptions } from "@/lib/domain/business-options"
import { getIntegrationStatuses } from "@/lib/config/integration-status"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { BillingPlanForm } from "./BillingPlanForm"
import { getOwnerBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Billing",
  description: "Choose a LeadReply plan and start Stripe checkout when billing is configured.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function BillingSettingsPage() {
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
  })

  if (!business) {
    redirect("/settings/business")
  }

  const stripeStatus = getIntegrationStatuses().find(
    (status) => status.key === "stripe"
  )

  return (
    <SettingsShell>
      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Billing
            </p>
            <h1 className="mt-2 text-3xl font-bold text-lr-strong">
              Plan selection
            </h1>
            <p className="mt-3 max-w-2xl text-lr-muted">
              Save the plan now, then connect Stripe checkout when the live
              price IDs are ready.
            </p>
          </div>
          <div className="rounded-2xl border border-lr-border p-4">
            <p className="text-sm text-lr-subtle">Billing status</p>
            <p className="mt-1 font-bold text-lr-strong">
              {business.billingStatus.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-xs text-lr-subtle">
              {stripeStatus?.configured
                ? "Stripe env keys are configured."
                : "Stripe env keys are still needed."}
            </p>
          </div>
        </div>

        <BillingPlanForm
          initialPlan={business.selectedPlan}
          stripeConfigured={Boolean(stripeStatus?.configured)}
          hasStripeCustomer={Boolean(business.stripeCustomerId)}
          billingStatus={business.billingStatus}
          plans={planOptions}
        />
      </section>
    </SettingsShell>
  )
}
