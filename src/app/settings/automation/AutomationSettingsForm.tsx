"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type AutomationSettingsFormProps = {
  initialSettings: {
    phoneAutomationEnabled: boolean
    bookingAutomationEnabled: boolean
    autoSchedulingEnabled: boolean
    quoteEstimateEnabled: boolean
    quoteRules: string
    quoteDisclaimer: string
    callbackTimeframe: string
    reviewAutomationEnabled: boolean
    preferredContactMethod: string
    bookingNotes: string
    seoSetupNotes: string
    marketingSetupNotes: string
  }
}

export function AutomationSettingsForm({
  initialSettings,
}: AutomationSettingsFormProps) {
  const router = useRouter()
  const [phoneAutomationEnabled, setPhoneAutomationEnabled] = useState(
    initialSettings.phoneAutomationEnabled
  )
  const [bookingAutomationEnabled, setBookingAutomationEnabled] = useState(
    initialSettings.bookingAutomationEnabled
  )
  const [autoSchedulingEnabled, setAutoSchedulingEnabled] = useState(
    initialSettings.autoSchedulingEnabled
  )
  const [quoteEstimateEnabled, setQuoteEstimateEnabled] = useState(
    initialSettings.quoteEstimateEnabled
  )
  const [quoteRules, setQuoteRules] = useState(initialSettings.quoteRules)
  const [quoteDisclaimer, setQuoteDisclaimer] = useState(
    initialSettings.quoteDisclaimer
  )
  const [callbackTimeframe, setCallbackTimeframe] = useState(
    initialSettings.callbackTimeframe
  )
  const [reviewAutomationEnabled, setReviewAutomationEnabled] = useState(
    initialSettings.reviewAutomationEnabled
  )
  const [preferredContactMethod, setPreferredContactMethod] = useState(
    initialSettings.preferredContactMethod
  )
  const [bookingNotes, setBookingNotes] = useState(
    initialSettings.bookingNotes
  )
  const [seoSetupNotes, setSeoSetupNotes] = useState(
    initialSettings.seoSetupNotes
  )
  const [marketingSetupNotes, setMarketingSetupNotes] = useState(
    initialSettings.marketingSetupNotes
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business/automation", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneAutomationEnabled,
          bookingAutomationEnabled,
          autoSchedulingEnabled,
          quoteEstimateEnabled,
          quoteRules,
          quoteDisclaimer,
          callbackTimeframe,
          reviewAutomationEnabled,
          preferredContactMethod,
          bookingNotes,
          seoSetupNotes,
          marketingSetupNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Automation settings saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <section className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">Communication</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={phoneAutomationEnabled}
              onChange={(e) => setPhoneAutomationEnabled(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-slate-950">
                Phone line automation
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Prepare missed-call routing and text follow-up settings.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={reviewAutomationEnabled}
              onChange={(e) => setReviewAutomationEnabled(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-slate-950">
                Review requests
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Prompt happy customers for reviews after won leads.
              </span>
            </span>
          </label>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">
            Preferred contact method
          </label>
          <select
            value={preferredContactMethod}
            onChange={(e) => setPreferredContactMethod(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="TEXT">Text first</option>
            <option value="CALL">Call first</option>
            <option value="EMAIL">Email first</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={bookingAutomationEnabled}
            onChange={(e) => setBookingAutomationEnabled(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-semibold text-slate-950">
              Booking or reservation workflow
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Collect how appointments, reservations, or estimates should be
              handled.
            </span>
          </span>
        </label>
        <textarea
          value={bookingNotes}
          onChange={(e) => setBookingNotes(e.target.value)}
          className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          placeholder="Example: ask party size, preferred time, and phone number before confirming."
        />
        <label className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={autoSchedulingEnabled}
            onChange={(e) => setAutoSchedulingEnabled(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-semibold text-slate-950">
              Allow confirmed self-scheduling
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Only confirm a time when a connected calendar or booking system
              verifies the slot. Otherwise collect preferred times for owner
              approval.
            </span>
          </span>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">
          Quote and callback guard rails
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Keep customer-facing estimates clear, limited, and easy for the owner
          to confirm.
        </p>
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={quoteEstimateEnabled}
              onChange={(e) => setQuoteEstimateEnabled(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-slate-950">
                Allow estimated quote ranges
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                The concierge can mention estimated ranges only from the rules
                below and must say final pricing is confirmed by the business.
              </span>
            </span>
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimate rules
            </label>
            <textarea
              value={quoteRules}
              onChange={(e) => setQuoteRules(e.target.value)}
              className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Example: Brake pads usually $250-$450. Oil changes usually $45-$90. Diagnostic fee starts at $95."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimate disclaimer
            </label>
            <textarea
              value={quoteDisclaimer}
              onChange={(e) => setQuoteDisclaimer(e.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Callback expectation
            </label>
            <input
              type="text"
              value={callbackTimeframe}
              onChange={(e) => setCallbackTimeframe(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="within one business day"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-950">SEO setup</h2>
          <textarea
            value={seoSetupNotes}
            onChange={(e) => setSeoSetupNotes(e.target.value)}
            className="mt-4 min-h-36 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            placeholder="Services, service areas, hours, website notes, Google profile needs."
          />
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-950">
            Marketing setup
          </h2>
          <textarea
            value={marketingSetupNotes}
            onChange={(e) => setMarketingSetupNotes(e.target.value)}
            className="mt-4 min-h-36 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            placeholder="Social platforms, promotions, content ideas, seasonal campaigns."
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save automation settings"}
      </button>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  )
}
