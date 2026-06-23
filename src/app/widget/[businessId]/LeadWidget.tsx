"use client"

import { useState } from "react"

type LeadWidgetProps = {
  businessId: string
  business: {
    name: string
    widgetGreeting: string
    widgetPrimaryAction: string
    widgetAccentColor: string
  }
}

function emptyForm(action: string) {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    requestDetails: "",
    preferredContactTime: "",
    action,
  }
}

export function LeadWidget({ businessId, business }: LeadWidgetProps) {
  const [form, setForm] = useState(emptyForm(business.widgetPrimaryAction))
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function updateForm(field: keyof ReturnType<typeof emptyForm>, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function submitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/widget/${businessId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setSubmitted(true)
      setForm(emptyForm(form.action))
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lr-page px-4 py-6">
      <main className="mx-auto max-w-md rounded-2xl bg-lr-surface p-5 shadow-sm">
        <div
          className="rounded-2xl p-5 text-white"
          style={{ backgroundColor: business.widgetAccentColor }}
        >
          <p className="text-sm font-semibold">{business.name}</p>
          <h1 className="mt-3 text-3xl font-bold">
            {form.action === "TEXT" ? "Text us" : "Request a callback"}
          </h1>
          <p className="mt-3 text-sm text-white/90">
            {business.widgetGreeting}
          </p>
        </div>

        {submitted ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-xl font-bold text-lr-strong">
              Request received
            </h2>
            <p className="mt-2 text-sm text-lr-body">
              The business has your info and can follow up from LeadReply.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Send another request
            </button>
          </div>
        ) : (
          <form onSubmit={submitRequest} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-lr-hover p-1">
              <button
                type="button"
                onClick={() => updateForm("action", "CALLBACK")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  form.action === "CALLBACK"
                    ? "bg-lr-surface text-lr-strong shadow-sm"
                    : "text-lr-muted"
                }`}
              >
                Callback
              </button>
              <button
                type="button"
                onClick={() => updateForm("action", "TEXT")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  form.action === "TEXT"
                    ? "bg-lr-surface text-lr-strong shadow-sm"
                    : "text-lr-muted"
                }`}
              >
                Text
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => updateForm("customerName", e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => updateForm("customerPhone", e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => updateForm("customerEmail", e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                How can we help?
              </label>
              <textarea
                value={form.requestDetails}
                onChange={(e) => updateForm("requestDetails", e.target.value)}
                className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Best time to reach you
              </label>
              <input
                type="text"
                value={form.preferredContactTime}
                onChange={(e) =>
                  updateForm("preferredContactTime", e.target.value)
                }
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                placeholder="Tomorrow morning, today after 4, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: business.widgetAccentColor }}
            >
              {loading ? "Sending..." : "Send request"}
            </button>

            {message && <p className="text-sm text-lr-muted">{message}</p>}
          </form>
        )}
      </main>
    </div>
  )
}
