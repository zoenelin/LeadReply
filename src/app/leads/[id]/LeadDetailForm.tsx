"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  centsToDollars,
  leadSourceOptions,
  leadStatusOptions,
} from "@/lib/lead-options"

type LeadDetailFormLead = {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  source: string
  status: string
  estimatedValueCents: number
  wonValueCents: number
  notes: string
  followUpAt: Date | string | null
  followUpNote: string
  followUpCompletedAt: Date | string | null
  reviewRequests: {
    id: string
  }[]
}

type LeadDetailFormProps = {
  lead: LeadDetailFormLead
}

function dateInputValue(value: Date | string | null) {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().slice(0, 10)
}

export function LeadDetailForm({ lead }: LeadDetailFormProps) {
  const router = useRouter()
  const [customerName, setCustomerName] = useState(lead.customerName)
  const [customerPhone, setCustomerPhone] = useState(lead.customerPhone)
  const [customerEmail, setCustomerEmail] = useState(lead.customerEmail)
  const [source, setSource] = useState(lead.source)
  const [status, setStatus] = useState(lead.status)
  const [estimatedValue, setEstimatedValue] = useState(
    centsToDollars(lead.estimatedValueCents)
  )
  const [wonValue, setWonValue] = useState(centsToDollars(lead.wonValueCents))
  const [followUpAt, setFollowUpAt] = useState(dateInputValue(lead.followUpAt))
  const [followUpNote, setFollowUpNote] = useState(lead.followUpNote)
  const [followUpCompleted, setFollowUpCompleted] = useState(
    Boolean(lead.followUpCompletedAt)
  )
  const [notes, setNotes] = useState(lead.notes)
  const [reviewMessage, setReviewMessage] = useState(
    "Thanks for choosing us. Would you mind leaving a quick review?"
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          source,
          status,
          estimatedValue,
          wonValue,
          notes,
          followUpAt,
          followUpNote,
          followUpCompleted,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Lead saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function createReviewRequest(markSent: boolean) {
    setReviewLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead.id,
          message: reviewMessage,
          markSent,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(markSent ? "Review request marked sent." : "Review request drafted.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">Lead details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              {leadSourceOptions.map((sourceOption) => (
                <option key={sourceOption.value} value={sourceOption.value}>
                  {sourceOption.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              {leadStatusOptions.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimated value
            </label>
            <input
              type="number"
              min="0"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Won value</label>
            <input
              type="number"
              min="0"
              value={wonValue}
              onChange={(e) => setWonValue(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Follow-up date
            </label>
            <input
              type="date"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={followUpCompleted}
              onChange={(e) => setFollowUpCompleted(e.target.checked)}
              className="h-4 w-4"
            />
            Follow-up complete
          </label>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">
            Follow-up note
          </label>
          <textarea
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save lead"}
        </button>
      </form>

      {status === "WON" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-xl font-bold text-slate-950">
            Ask for a review
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            This keeps the review workflow simple until we connect real Google
            review automation.
          </p>
          <textarea
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
            className="mt-4 min-h-24 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={reviewLoading}
              onClick={() => createReviewRequest(false)}
              className="rounded-xl border border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-white disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={reviewLoading}
              onClick={() => createReviewRequest(true)}
              className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Mark sent
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  )
}
