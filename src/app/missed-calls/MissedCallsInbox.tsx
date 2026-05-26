"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type MissedCall = {
  id: string
  callerName: string
  callerPhone: string
  createdAt: string
  reason: string
  status: string
  convertedLeadId: string | null
}

type MissedCallsInboxProps = {
  calls: MissedCall[]
  replyTemplate: string
}

export function MissedCallsInbox({
  calls,
  replyTemplate,
}: MissedCallsInboxProps) {
  const [localCalls, setLocalCalls] = useState(calls)
  const [selectedCallId, setSelectedCallId] = useState(calls[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const selectedCall = useMemo(
    () =>
      localCalls.find((call) => call.id === selectedCallId) ?? localCalls[0],
    [localCalls, selectedCallId]
  )

  async function markAsReplied() {
    if (!selectedCall) {
      return
    }

    setMessage("")

    const res = await fetch(`/api/missed-calls/${selectedCall.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "REPLIED" }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error || "Something went wrong.")
      return
    }

    setLocalCalls((currentCalls) =>
      currentCalls.map((call) =>
        call.id === selectedCall.id ? { ...call, status: "REPLIED" } : call
      )
    )
    setMessage("Call marked as replied.")
  }

  async function convertToLead() {
    if (!selectedCall) {
      return
    }

    setMessage("")

    const res = await fetch(`/api/missed-calls/${selectedCall.id}`, {
      method: "POST",
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error || "Something went wrong.")
      return
    }

    setLocalCalls((currentCalls) =>
      currentCalls.map((call) =>
        call.id === selectedCall.id
          ? { ...call, convertedLeadId: data.lead.id }
          : call
      )
    )
    setMessage(
      data.alreadyConverted
        ? "This missed call is already in the pipeline."
        : "Lead created from missed call."
    )
  }

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(replyTemplate)
      setMessage("Reply copied.")
    } catch {
      setMessage("Could not copy the reply.")
    }
  }

  if (!selectedCall) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600">No missed calls yet.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="px-2 text-sm font-medium text-slate-500">Missed calls</p>
        <div className="mt-3 space-y-2">
          {localCalls.map((call) => (
            <button
              key={call.id}
              type="button"
              onClick={() => {
                setSelectedCallId(call.id)
                setMessage("")
              }}
              className={`w-full rounded-xl border p-4 text-left ${
                selectedCall.id === call.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {call.callerName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {call.callerPhone}
                  </p>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    call.status === "REPLIED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {call.status === "REPLIED" ? "Replied" : "New"}
                </span>
                {call.convertedLeadId && (
                  <span className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                    Lead
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600">{call.reason}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-6">
        <p className="text-sm font-medium text-slate-500">Selected call</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          {selectedCall.callerName}
        </h2>
        <p className="mt-1 text-slate-600">{selectedCall.callerPhone}</p>
        <p className="mt-1 text-sm text-slate-500">
          {new Date(selectedCall.createdAt).toLocaleString()}
        </p>
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          {selectedCall.reason}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Reply ready to send
            </p>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Draft
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-slate-800">
            {replyTemplate}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={markAsReplied}
            disabled={selectedCall.status === "REPLIED"}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {selectedCall.status === "REPLIED"
              ? "Already replied"
              : "Mark as replied"}
          </button>
          <button
            type="button"
            onClick={copyReply}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Copy reply
          </button>
          <button
            type="button"
            onClick={convertToLead}
            disabled={Boolean(selectedCall.convertedLeadId)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {selectedCall.convertedLeadId
              ? "Already in pipeline"
              : "Convert to lead"}
          </button>
          {selectedCall.convertedLeadId && (
            <Link
              href={`/leads/${selectedCall.convertedLeadId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open lead
            </Link>
          )}
        </div>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  )
}
