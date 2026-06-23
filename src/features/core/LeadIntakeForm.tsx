"use client"

import { useState } from "react"

type LeadIntakeFormProps = {
  businessId: string
}

function emptyForm() {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    requestDetails: "",
    preferredContactTime: "",
  }
}

export function LeadIntakeForm({ businessId }: LeadIntakeFormProps) {
  const [form, setForm] = useState(emptyForm())
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function updateForm(field: keyof ReturnType<typeof emptyForm>, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/intake/${businessId}`, {
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
      setForm(emptyForm())
      setMessage("Request sent. The team will follow up soon.")
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-lr-strong">
          Name
        </label>
        <input
          type="text"
          value={form.customerName}
          onChange={(e) => updateForm("customerName", e.target.value)}
          className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-lr-strong">
            Phone
          </label>
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => updateForm("customerPhone", e.target.value)}
            className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-lr-strong">
            Email
          </label>
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) => updateForm("customerEmail", e.target.value)}
            className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-lr-strong">
          What do you need help with?
        </label>
        <textarea
          value={form.requestDetails}
          onChange={(e) => updateForm("requestDetails", e.target.value)}
          className="min-h-32 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-lr-strong">
          Best time to reach you
        </label>
        <input
          type="text"
          value={form.preferredContactTime}
          onChange={(e) => updateForm("preferredContactTime", e.target.value)}
          className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
          placeholder="Example: tomorrow morning"
        />
      </div>

      <button
        type="submit"
        disabled={loading || submitted}
        className="w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
      >
        {loading ? "Sending..." : submitted ? "Request sent" : "Send request"}
      </button>

      {message && (
        <p className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-body">
          {message}
        </p>
      )}
    </form>
  )
}
