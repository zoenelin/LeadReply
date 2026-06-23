"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type ReviewDiscountFormProps = {
  initialEnabled: boolean
  initialOffer: string
}

export function ReviewDiscountForm({
  initialEnabled,
  initialOffer,
}: ReviewDiscountFormProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [offer, setOffer] = useState(initialOffer)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function saveDiscount() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business/reviews", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewDiscountEnabled: enabled,
          reviewDiscountOffer: offer,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not save.")
        return
      }

      setMessage("Saved.")
      router.refresh()
    } catch {
      setMessage("Could not save right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-lr-border bg-lr-surface p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold text-lr-subtle">Review offer</p>
          <h2 className="mt-1 text-xl font-black text-lr-strong">
            Optional thank-you discount
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-lr-muted">
            Add a simple thank-you offer for customers who leave an honest
            review. Do not require a positive rating.
          </p>
        </div>
        <label className="flex w-fit items-center gap-3 rounded-xl border border-lr-border bg-lr-surface-muted px-4 py-3 text-sm font-bold text-lr-strong">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 accent-lr-primary"
          />
          Offer discount
        </label>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={offer}
          onChange={(event) => setOffer(event.target.value)}
          disabled={!enabled}
          maxLength={180}
          placeholder="Example: 10% off your next visit"
          className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm text-lr-strong outline-none focus:border-lr-strong disabled:bg-lr-surface-muted disabled:text-lr-subtle"
        />
        <button
          type="button"
          disabled={loading}
          onClick={saveDiscount}
          className="rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-bold text-lr-strong hover:bg-lr-hover disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save offer"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm font-medium text-lr-muted">{message}</p>}
    </div>
  )
}
