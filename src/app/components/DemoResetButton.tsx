"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function DemoResetButton() {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function resetDemoData() {
    const confirmed = window.confirm(
      "Reset demo leads, missed calls, and review requests for this business?"
    )

    if (!confirmed) {
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(
        `Demo reset: ${data.leads} leads and ${data.missedCalls} missed calls.`
      )
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={resetDemoData}
        disabled={loading}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? "Resetting..." : "Reset demo data"}
      </button>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  )
}
