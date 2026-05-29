"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type BillingPlanFormProps = {
  initialPlan: string
  stripeConfigured: boolean
  hasStripeCustomer: boolean
  billingStatus: string
  plans: {
    value: string
    label: string
    tagline: string
    features: string[]
  }[]
}

export function BillingPlanForm({
  initialPlan,
  stripeConfigured,
  hasStripeCustomer,
  billingStatus,
  plans,
}: BillingPlanFormProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function savePlan(plan: string) {
    setSelectedPlan(plan)
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/billing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedPlan: plan,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Plan saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function startCheckout(plan: string) {
    setSelectedPlan(plan)
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedPlan: plan,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Stripe checkout is not ready yet.")
        router.refresh()
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function openCustomerPortal() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Stripe customer portal is not ready yet.")
        return
      }

      window.location.href = data.portalUrl
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Current billing status: {billingStatus.replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {hasStripeCustomer
                ? "A Stripe customer is connected for this business."
                : "A Stripe customer will be created after checkout is completed."}
            </p>
          </div>
          <button
            type="button"
            onClick={openCustomerPortal}
            disabled={loading || !hasStripeCustomer || !stripeConfigured}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Opening..." : "Customer portal"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.value}
            className={`rounded-2xl border p-5 text-left ${
              selectedPlan === plan.value
                ? "border-slate-950 bg-slate-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-slate-950">
                  {plan.label}
                </p>
                <p className="mt-2 text-sm text-slate-600">{plan.tagline}</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                {stripeConfigured ? "Checkout" : "Setup"}
              </span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-slate-500">
              {stripeConfigured ? "Stripe checkout ready" : "Pricing coming soon"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => savePlan(plan.value)}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading && selectedPlan === plan.value ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => startCheckout(plan.value)}
                disabled={loading}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading && selectedPlan === plan.value
                  ? "Starting..."
                  : "Start checkout"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </div>
  )
}
