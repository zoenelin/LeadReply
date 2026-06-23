"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type ReviewSendButtonProps =
  | {
      leadId: string
      requestId?: never
    }
  | {
      leadId?: never
      requestId: string
    }

export function ReviewSendButton({
  leadId,
  requestId,
}: ReviewSendButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function sendRequest() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(
        requestId ? `/api/review-requests/${requestId}/send` : "/api/review-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestId
            ? JSON.stringify({})
            : JSON.stringify({
                leadId,
                markSent: true,
              }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || data.deliveryMessage || "Could not send.")
        return
      }

      setMessage(data.deliveryMessage || "Review request sent.")
      router.refresh()
    } catch {
      setMessage("Could not send right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={sendRequest}
        className="inline-flex w-full items-center justify-center rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending..." : "Send request"}
      </button>
      {message && <p className="mt-2 text-xs font-medium text-lr-muted">{message}</p>}
    </div>
  )
}
