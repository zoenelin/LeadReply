"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ReviewSyncButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function syncReviews() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/reviews/sync", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not check reviews yet.")
        return
      }

      setMessage(
        data.deduped
          ? "A review check is already queued."
          : "Review check queued."
      )
      router.refresh()
    } catch {
      setMessage("Could not check reviews yet.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={syncReviews}
        className="inline-flex w-full items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-bold text-lr-strong hover:bg-lr-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Checking..." : "Check Google reviews"}
      </button>
      {message && <p className="mt-2 text-xs font-medium text-lr-muted">{message}</p>}
    </div>
  )
}
