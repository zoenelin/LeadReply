"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type CalendarSettingsFormProps = {
  business: {
    calendarProvider: string
    calendarBookingUrl: string
    calendarSyncNotes: string
    autoSchedulingEnabled: boolean
  }
}

const providers = [
  { value: "", label: "Not connected yet" },
  { value: "GOOGLE_CALENDAR", label: "Google Calendar" },
  { value: "APPLE_CALENDAR", label: "Apple Calendar" },
  { value: "OUTLOOK", label: "Outlook" },
  { value: "OTHER", label: "Other" },
]

export function CalendarSettingsForm({ business }: CalendarSettingsFormProps) {
  const router = useRouter()
  const [calendarProvider, setCalendarProvider] = useState(
    business.calendarProvider
  )
  const [calendarBookingUrl, setCalendarBookingUrl] = useState(
    business.calendarBookingUrl
  )
  const [calendarSyncNotes, setCalendarSyncNotes] = useState(
    business.calendarSyncNotes
  )
  const [autoSchedulingEnabled, setAutoSchedulingEnabled] = useState(
    business.autoSchedulingEnabled
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function saveCalendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business/calendar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendarProvider,
          calendarBookingUrl,
          calendarSyncNotes,
          autoSchedulingEnabled,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Calendar setup saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={saveCalendar} className="mt-8 space-y-5">
      <div className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">
          Calendar connection
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              value={calendarProvider}
              onChange={(e) => setCalendarProvider(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Booking link
            </label>
            <input
              type="url"
              value={calendarBookingUrl}
              onChange={(e) => setCalendarBookingUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="https://calendly.com/example"
            />
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={autoSchedulingEnabled}
            onChange={(e) => setAutoSchedulingEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="block font-semibold text-slate-950">
              Allow self-scheduling when available
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              LeadReply will collect scheduling intent now and use this setting
              once live calendar sync is connected.
            </span>
          </span>
        </label>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium">
            Scheduling notes
          </label>
          <textarea
            value={calendarSyncNotes}
            onChange={(e) => setCalendarSyncNotes(e.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            placeholder="Example: dinner reservations require manager approval, service appointments use Google Calendar, no same-day bookings."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save calendar setup"}
      </button>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  )
}
