"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function LaunchActionPanel() {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function clearData() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/demo/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setConfirmation("")
      setMessage("CRM activity cleared.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold text-lr-strong">
            CRM activity cleanup
          </h2>
          <p className="mt-2 max-w-xl text-sm text-lr-muted">
            Deletes all leads, missed calls, review requests, follow-ups, and
            team notes for this business. Use it before connecting a real
            client account.
          </p>
        </div>
        <div className="w-full md:max-w-xs">
          <label className="mb-1 block text-sm font-medium">
            Type CLEAR to confirm
          </label>
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          />
          <button
            type="button"
            onClick={clearData}
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            {loading ? "Clearing..." : "Clear CRM activity"}
          </button>
          {message && <p className="mt-3 text-sm text-lr-muted">{message}</p>}
        </div>
      </div>
    </section>
  )
}
