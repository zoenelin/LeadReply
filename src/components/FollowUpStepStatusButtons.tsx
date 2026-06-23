"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { communicationStatuses } from "@/lib/domain/status"

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
        {status !== communicationStatuses.sent && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus(communicationStatuses.sent)}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loadingStatus === communicationStatuses.sent ? "Saving..." : "Mark sent"}
          </button>
        )}
        {status !== communicationStatuses.skipped && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus(communicationStatuses.skipped)}
            className="rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 text-xs font-semibold text-lr-body hover:bg-lr-hover disabled:opacity-60"
          >
            {loadingStatus === communicationStatuses.skipped ? "Saving..." : "Skip"}
          </button>
        )}
        {status !== communicationStatuses.draft && (
          <button
            type="button"
            disabled={Boolean(loadingStatus)}
            onClick={() => updateStatus(communicationStatuses.draft)}
            className="rounded-lg border border-amber-300 bg-lr-surface px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
          >
            {loadingStatus === communicationStatuses.draft ? "Saving..." : "Reopen"}
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-xs text-lr-muted">{message}</p>}
    </div>
  )
}
