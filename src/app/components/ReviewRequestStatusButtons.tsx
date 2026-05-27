"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type ReviewRequestStatusButtonsProps = {
  requestId: string
  status: string
}

export function ReviewRequestStatusButtons({
  requestId,
  status,
}: ReviewRequestStatusButtonsProps) {
  const router = useRouter()
  const [loadingStatus, setLoadingStatus] = useState("")
  const [message, setMessage] = useState("")

  async function updateStatus(nextStatus: string) {
    setLoadingStatus(nextStatus)
    setMessage("")

    try {
      const res = await fetch(`/api/review-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Review status updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoadingStatus("")
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {status !== "SENT" && status !== "RECEIVED" && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus("SENT")}
            className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
          >
            {loadingStatus === "SENT" ? "Saving..." : "Mark sent"}
          </button>
        )}
        {status !== "RECEIVED" && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus("RECEIVED")}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loadingStatus === "RECEIVED" ? "Saving..." : "Review received"}
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
    </div>
  )
}
