"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type BillingPlanFormProps = {
  initialPlan: string
  plans: {
    value: string
    label: string
    tagline: string
    features: string[]
  }[]
}

export function BillingPlanForm({ initialPlan, plans }: BillingPlanFormProps) {
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

  return (
    <div className="mt-8">
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <button
            key={plan.value}
            type="button"
            onClick={() => savePlan(plan.value)}
            disabled={loading}
            className={`rounded-2xl border p-5 text-left disabled:opacity-60 ${
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
                Soon
              </span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-slate-500">
              Pricing coming soon
            </p>
          </button>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </div>
  )
}
