"use client"

import Link from "next/link"
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
    googleReviewUrl: string
    googleBusinessProfileUrl: string
    launchNotes: string
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
  const [seoSetupNotes] = useState(initialSettings.seoSetupNotes)
  const [marketingSetupNotes] = useState(initialSettings.marketingSetupNotes)
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    initialSettings.googleReviewUrl
  )
  const [googleBusinessProfileUrl, setGoogleBusinessProfileUrl] = useState(
    initialSettings.googleBusinessProfileUrl
  )
  const [launchNotes, setLaunchNotes] = useState(initialSettings.launchNotes)
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
          googleReviewUrl,
          googleBusinessProfileUrl,
          launchNotes,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">Communication</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
            <input
              type="checkbox"
              checked={phoneAutomationEnabled}
              onChange={(e) => setPhoneAutomationEnabled(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-lr-strong">
                Phone line automation
              </span>
              <span className="mt-1 block text-sm text-lr-muted">
                Prepare missed-call routing and text follow-up settings.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
            <input
              type="checkbox"
              checked={reviewAutomationEnabled}
              onChange={(e) => setReviewAutomationEnabled(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-lr-strong">
                Review requests
              </span>
              <span className="mt-1 block text-sm text-lr-muted">
                Prompt happy customers for reviews after captured leads.
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
            className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
          >
            <option value="TEXT">Text first</option>
            <option value="CALL">Call first</option>
            <option value="EMAIL">Email first</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-lr-border p-5">
        <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
          <input
            type="checkbox"
            checked={bookingAutomationEnabled}
            onChange={(e) => setBookingAutomationEnabled(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-semibold text-lr-strong">
              Booking or reservation workflow
            </span>
            <span className="mt-1 block text-sm text-lr-muted">
              Collect how appointments, reservations, or estimates should be
              handled.
            </span>
          </span>
        </label>
        <textarea
          value={bookingNotes}
          onChange={(e) => setBookingNotes(e.target.value)}
          className="mt-4 min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          placeholder="Example: ask party size, preferred time, and phone number before confirming."
        />
        <label className="mt-4 flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
          <input
            type="checkbox"
            checked={autoSchedulingEnabled}
            onChange={(e) => setAutoSchedulingEnabled(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-semibold text-lr-strong">
              Allow confirmed self-scheduling
            </span>
            <span className="mt-1 block text-sm text-lr-muted">
              Only confirm a time when a connected calendar or booking system
              verifies the slot. Otherwise collect preferred times for owner
              approval.
            </span>
          </span>
        </label>
      </section>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">
          Quote and callback rules
        </h2>
        <p className="mt-2 text-sm text-lr-muted">
          Keep customer-facing estimates clear, limited, and easy for the owner
          to confirm.
        </p>
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
            <input
              type="checkbox"
              checked={quoteEstimateEnabled}
              onChange={(e) => setQuoteEstimateEnabled(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-lr-strong">
                Allow estimated quote ranges
              </span>
              <span className="mt-1 block text-sm text-lr-muted">
                The missed-call assistant can mention estimated ranges only from the rules
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
              className="min-h-32 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
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
              className="min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
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
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="within one business day"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          SEO and marketing
        </p>
        <h2 className="mt-2 text-xl font-bold text-lr-strong">
          SEO and marketing live in Growth
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-lr-body">
          Use the Growth tab for requests, approvals, campaign notes, and
          search work.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/growth"
            className="inline-flex rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover"
          >
            Open Growth
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">
          Google and launch notes
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Google review link
            </label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="https://g.page/r/..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Google Business Profile link
            </label>
            <input
              type="url"
              value={googleBusinessProfileUrl}
              onChange={(e) => setGoogleBusinessProfileUrl(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="https://business.google.com/..."
            />
          </div>
        </div>
        <label className="mt-4 block text-sm font-medium">Launch notes</label>
        <textarea
          value={launchNotes}
          onChange={(e) => setLaunchNotes(e.target.value)}
          className="mt-1 min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          placeholder="Anything the business needs before launch: phone number porting, Stripe products, review links, calendar access, staff training."
        />
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save automation settings"}
      </button>

      {message && <p className="text-sm text-lr-muted">{message}</p>}
    </form>
  )
}
