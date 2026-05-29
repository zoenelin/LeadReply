"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  appointmentStatusClassName,
  appointmentStatusLabels,
  centsToDollars,
  formatMoney,
  leadSourceLabels,
  leadSourceOptions,
  leadStatusLabels,
  leadStatusOptions,
  statusClassName,
} from "@/lib/lead-options"
import { getLeadQualityScore } from "@/lib/lead-quality"

type LeadPipelineLead = {
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
  appointmentStatus: string
  appointmentAt: Date | string | null
  appointmentNotes: string
  createdAt: Date | string
  closedAt: Date | string | null
  serviceOfferingId: string | null
  conciergeIntakes: {
    status: string
    quoteRequested: boolean
    schedulingRequested: boolean
    matchedServiceName: string
  }[]
  reviewRequests: {
    id: string
  }[]
}

type LeadPipelineProps = {
  leads: LeadPipelineLead[]
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return "No date"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function dateInputValue(value: Date | string | null) {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    source: "MANUAL",
    status: "NEW",
    estimatedValue: "",
    wonValue: "",
    followUpAt: "",
    followUpNote: "",
    notes: "",
  }
}

export function LeadPipeline({ leads }: LeadPipelineProps) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm())
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sourceFilter, setSourceFilter] = useState("ALL")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const statusMatches =
        statusFilter === "ALL" || lead.status === statusFilter
      const sourceMatches =
        sourceFilter === "ALL" || lead.source === sourceFilter

      return statusMatches && sourceMatches
    })
  }, [leads, sourceFilter, statusFilter])

  function updateForm(field: keyof ReturnType<typeof emptyForm>, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function handleCreateLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/leads", {
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

      setForm(emptyForm())
      setMessage("Lead added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function quickUpdateStatus(lead: LeadPipelineLead, status: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          customerEmail: lead.customerEmail,
          source: lead.source,
          status,
          estimatedValue: centsToDollars(lead.estimatedValueCents),
          wonValue: centsToDollars(
            status === "WON" && lead.wonValueCents === 0
              ? lead.estimatedValueCents
              : lead.wonValueCents
          ),
          notes: lead.notes,
          followUpAt: dateInputValue(lead.followUpAt),
          followUpNote: lead.followUpNote,
          followUpCompleted: Boolean(lead.followUpCompletedAt),
          appointmentStatus: lead.appointmentStatus,
          appointmentAt: lead.appointmentAt
            ? new Date(lead.appointmentAt).toISOString().slice(0, 16)
            : "",
          appointmentNotes: lead.appointmentNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Lead updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
      <form
        onSubmit={handleCreateLead}
        className="rounded-2xl border border-slate-200 p-5"
      >
        <h2 className="text-xl font-bold text-slate-950">Add lead</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => updateForm("customerName", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => updateForm("customerPhone", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => updateForm("customerEmail", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Source</label>
              <select
                value={form.source}
                onChange={(e) => updateForm("source", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
              >
                {leadSourceOptions.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
              >
                {leadStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Estimated value
              </label>
              <input
                type="number"
                min="0"
                value={form.estimatedValue}
                onChange={(e) => updateForm("estimatedValue", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Captured value
              </label>
              <input
                type="number"
                min="0"
                value={form.wonValue}
                onChange={(e) => updateForm("wonValue", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Follow-up date
            </label>
            <input
              type="date"
              value={form.followUpAt}
              onChange={(e) => updateForm("followUpAt", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Follow-up note
            </label>
            <textarea
              value={form.followUpNote}
              onChange={(e) => updateForm("followUpNote", e.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Call back tomorrow about the estimate."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add lead"}
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </form>

      <div>
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="ALL">All statuses</option>
            {leadStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="ALL">All sources</option>
            {leadSourceOptions.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 space-y-4">
          {filteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-lg font-bold text-slate-950">No leads yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Add the first lead to start filling your pipeline.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const qualityScore = getLeadQualityScore(lead)

              return (
                <article
                  key={lead.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">
                        {lead.customerName}
                      </h3>
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                          lead.status
                        )}`}
                      >
                        {leadStatusLabels[lead.status] ?? lead.status}
                      </span>
                      <span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                        {qualityScore.label} {qualityScore.score}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${appointmentStatusClassName(
                          lead.appointmentStatus
                        )}`}
                      >
                        {appointmentStatusLabels[lead.appointmentStatus] ??
                          lead.appointmentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {lead.customerPhone}
                      {lead.customerEmail ? ` - ${lead.customerEmail}` : ""}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      {leadSourceLabels[lead.source] ?? lead.source}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-slate-950">
                      {formatMoney(
                        lead.status === "WON"
                          ? lead.wonValueCents
                          : lead.estimatedValueCents
                      )}
                    </p>
                    <p className="text-sm text-slate-500">
                      Follow up: {formatDate(lead.followUpAt)}
                    </p>
                  </div>
                </div>

                {lead.followUpNote && (
                  <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {lead.followUpNote}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {leadStatusOptions.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => quickUpdateStatus(lead, status.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        lead.status === status.value
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                  <Link
                    href={`/leads/${lead.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Details
                  </Link>
                </div>
              </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
