"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type FollowUpStepStatusButtonsProps = {
  stepId: string
  status: string
}

export function FollowUpStepStatusButtons({
  stepId,
  status,
}: FollowUpStepStatusButtonsProps) {
  const router = useRouter()
  const [loadingStatus, setLoadingStatus] = useState("")
  const [message, setMessage] = useState("")

  async function updateStatus(nextStatus: string) {
    setLoadingStatus(nextStatus)
    setMessage("")

    try {
      const res = await fetch(`/api/follow-up-steps/${stepId}`, {
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

      setMessage(data.deliveryMessage || "Follow-up step updated.")
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
        {status !== "SENT" && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus("SENT")}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loadingStatus === "SENT" ? "Saving..." : "Mark sent"}
          </button>
        )}
        {status !== "SKIPPED" && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus("SKIPPED")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingStatus === "SKIPPED" ? "Saving..." : "Skip"}
          </button>
        )}
        {status !== "DRAFT" && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus("DRAFT")}
            className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
          >
            {loadingStatus === "DRAFT" ? "Saving..." : "Reopen"}
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
    </div>
  )
}
