"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  appointmentStatusOptions,
  centsToDollars,
  leadSourceOptions,
  leadStatusOptions,
  normalizeLeadStatus,
} from "@/lib/domain/lead-options"
import { leadStatuses } from "@/lib/domain/status"

type LeadDetailFormLead = {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  source: string
  sourceDetail: string
  marketingCampaignId: string | null
  status: string
  estimatedValueCents: number
  capturedValueCents: number
  notes: string
  followUpAt: Date | string | null
  followUpNote: string
  followUpCompletedAt: Date | string | null
  appointmentStatus: string
  appointmentAt: Date | string | null
  appointmentNotes: string
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

function dateTimeInputValue(value: Date | string | null) {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().slice(0, 16)
}

export function LeadDetailForm({ lead }: LeadDetailFormProps) {
  const router = useRouter()
  const [customerName, setCustomerName] = useState(lead.customerName)
  const [customerPhone, setCustomerPhone] = useState(lead.customerPhone)
  const [customerEmail, setCustomerEmail] = useState(lead.customerEmail)
  const [source, setSource] = useState(lead.source)
  const [sourceDetail, setSourceDetail] = useState(lead.sourceDetail)
  const [status, setStatus] = useState(normalizeLeadStatus(lead.status))
  const [capturedValue, setCapturedValue] = useState(
    centsToDollars(lead.capturedValueCents)
  )
  const [appointmentStatus, setAppointmentStatus] = useState(
    lead.appointmentStatus
  )
  const [appointmentAt, setAppointmentAt] = useState(
    dateTimeInputValue(lead.appointmentAt)
  )
  const [reviewMessage, setReviewMessage] = useState(
    "Thanks for choosing us. Would you mind leaving a quick review?"
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const isClosedLead = normalizeLeadStatus(lead.status) === leadStatuses.closed

  async function saveLead(
    nextStatus = status,
    successMessage = "Customer/job saved."
  ) {
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
          sourceDetail,
          marketingCampaignId: lead.marketingCampaignId ?? "",
          status: nextStatus,
          estimatedValue: centsToDollars(lead.estimatedValueCents),
          capturedValue,
          notes: lead.notes,
          followUpAt: dateInputValue(lead.followUpAt),
          followUpNote: lead.followUpNote,
          followUpCompleted: Boolean(lead.followUpCompletedAt),
          appointmentStatus,
          appointmentAt,
          appointmentNotes: lead.appointmentNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setStatus(nextStatus)
      setMessage(successMessage)
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await saveLead()
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

      setMessage(
        data.deliveryMessage ||
          (markSent ? "Review request marked sent." : "Review request drafted.")
      )
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">
          Customer/job details
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
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
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
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
              Source detail
            </label>
            <input
              type="text"
              value={sourceDetail}
              onChange={(e) => setSourceDetail(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Google post, referral name, spring promo"
            />
          </div>
          {(status === leadStatuses.captured ||
            status === leadStatuses.closed) && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Final value
              </label>
              <input
                type="number"
                min="0"
                value={capturedValue}
                onChange={(e) => setCapturedValue(e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                placeholder="Actual amount made"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Appointment status
            </label>
            <select
              value={appointmentStatus}
              onChange={(e) => setAppointmentStatus(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              {appointmentStatusOptions.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Appointment time
            </label>
            <input
              type="datetime-local"
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save customer/job"}
          </button>
          {isClosedLead && (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                saveLead(leadStatuses.current, "Customer/job reopened.")
              }
              className="rounded-xl border border-lr-border-strong px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover disabled:opacity-60"
            >
              Reopen customer/job
            </button>
          )}
        </div>
      </form>

      {status === leadStatuses.captured && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-xl font-bold text-lr-strong">
            Ask for a review
          </h2>
          <p className="mt-2 text-sm text-lr-body">
            If Twilio is configured, LeadReply can text this review request.
            Otherwise it stays trackable for manual sending.
          </p>
          <textarea
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
            className="mt-4 min-h-24 w-full rounded-xl border border-emerald-200 bg-lr-surface px-4 py-3 outline-none focus:border-emerald-500"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={reviewLoading}
              onClick={() => createReviewRequest(false)}
              className="rounded-xl border border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-lr-surface disabled:opacity-60"
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

      {message && <p className="text-sm text-lr-muted">{message}</p>}
    </div>
  )
}
