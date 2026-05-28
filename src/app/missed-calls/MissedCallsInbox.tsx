"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  conciergeStatusClassName,
  type ConciergeAnswerMap,
  type ConciergeTranscriptEntry,
  getConciergePlan,
  getConciergeStatusLabel,
} from "@/lib/concierge-intake"
import { formatResponseDuration, minutesBetween } from "@/lib/response-speed"

type MissedCallConciergeIntake = {
  id: string
  status: string
  currentStep: number
  intent: string
  urgency: string
  preferredTime: string
  schedulingRequested: boolean
  schedulingMode: string
  quoteRequested: boolean
  quoteGuidance: string
  summary: string
  nextAction: string
  transcript: ConciergeTranscriptEntry[]
  answers: ConciergeAnswerMap
  leadId: string | null
}

type MissedCall = {
  id: string
  callerName: string
  callerPhone: string
  createdAt: string
  repliedAt: string | null
  reason: string
  status: string
  convertedLeadId: string | null
  conciergeIntake: MissedCallConciergeIntake | null
}

type MissedCallsInboxProps = {
  calls: MissedCall[]
  replyTemplate: string
  businessName: string
  businessType: string
  bookingAutomationEnabled: boolean
}

export function MissedCallsInbox({
  calls,
  replyTemplate,
  businessName,
  businessType,
  bookingAutomationEnabled,
}: MissedCallsInboxProps) {
  const [localCalls, setLocalCalls] = useState(calls)
  const [selectedCallId, setSelectedCallId] = useState(calls[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const [answer, setAnswer] = useState("")
  const [conciergeLoading, setConciergeLoading] = useState(false)
  const selectedCall = useMemo(
    () =>
      localCalls.find((call) => call.id === selectedCallId) ?? localCalls[0],
    [localCalls, selectedCallId]
  )
  const conciergePlan = selectedCall
    ? getConciergePlan({
        businessName,
        businessType,
        callerName: selectedCall.callerName,
        bookingAutomationEnabled,
      })
    : null
  const currentQuestion =
    selectedCall?.conciergeIntake?.status === "IN_PROGRESS" && conciergePlan
      ? conciergePlan.questions[selectedCall.conciergeIntake.currentStep]
      : null

  function getCallResponseText(call: MissedCall) {
    if (call.repliedAt) {
      return `Replied in ${formatResponseDuration(
        minutesBetween(new Date(call.createdAt), new Date(call.repliedAt))
      )}`
    }

    return `Waiting ${formatResponseDuration(
      minutesBetween(new Date(call.createdAt), new Date())
    )}`
  }

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
        call.id === selectedCall.id
          ? {
              ...call,
              status: "REPLIED",
              repliedAt:
                data.missedCall.repliedAt ?? new Date().toISOString(),
            }
          : call
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

  function updateSelectedCall(updates: Partial<MissedCall>) {
    if (!selectedCall) {
      return
    }

    setLocalCalls((currentCalls) =>
      currentCalls.map((call) =>
        call.id === selectedCall.id ? { ...call, ...updates } : call
      )
    )
  }

  async function startConcierge() {
    if (!selectedCall) {
      return
    }

    setConciergeLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/concierge-intakes/${selectedCall.id}`, {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      updateSelectedCall({
        status: "REPLIED",
        repliedAt:
          data.missedCall?.repliedAt ?? selectedCall.repliedAt ?? new Date().toISOString(),
        conciergeIntake: data.intake,
      })
      setAnswer("")
      setMessage(
        data.alreadyStarted
          ? "Concierge intake already started."
          : "Mock concierge started and first reply drafted."
      )
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setConciergeLoading(false)
    }
  }

  async function submitConciergeAnswer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedCall || !answer.trim()) {
      return
    }

    setConciergeLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/concierge-intakes/${selectedCall.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      updateSelectedCall({
        conciergeIntake: data.intake,
        convertedLeadId:
          data.lead?.id ?? data.intake?.leadId ?? selectedCall.convertedLeadId,
      })
      setAnswer("")
      setMessage(
        data.lead
          ? "Concierge intake complete and lead updated."
          : "Customer answer saved."
      )
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setConciergeLoading(false)
    }
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
                {call.conciergeIntake && (
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${conciergeStatusClassName(
                      call.conciergeIntake.status
                    )}`}
                  >
                    AI
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600">{call.reason}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {getCallResponseText(call)}
              </p>
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
        <p className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {getCallResponseText(selectedCall)}
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

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
                AI missed-call concierge
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                {selectedCall.conciergeIntake
                  ? getConciergeStatusLabel(selectedCall.conciergeIntake.status)
                  : "Mock intake ready"}
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                Simulate the automatic text conversation before real phone and
                calendar integrations are connected.
              </p>
            </div>
            <span className="w-fit rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Mock mode
            </span>
          </div>

          {!selectedCall.conciergeIntake && (
            <div className="mt-5 rounded-xl bg-white p-4">
              <p className="text-sm font-medium text-slate-500">
                First automatic text
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {conciergePlan?.openingMessage}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {conciergePlan?.questions[0]?.prompt}
              </p>
              <button
                type="button"
                disabled={conciergeLoading}
                onClick={startConcierge}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {conciergeLoading ? "Starting..." : "Start mock concierge"}
              </button>
            </div>
          )}

          {selectedCall.conciergeIntake && (
            <div className="mt-5 space-y-4">
              <div className="space-y-3">
                {selectedCall.conciergeIntake.transcript.map((entry, index) => (
                  <div
                    key={`${entry.createdAt}-${index}`}
                    className={`rounded-xl p-4 text-sm ${
                      entry.role === "customer"
                        ? "bg-white text-slate-800"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {entry.role === "customer" ? "Customer" : "LeadReply"}
                    </p>
                    <p className="mt-2">{entry.text}</p>
                  </div>
                ))}
              </div>

              {currentQuestion && (
                <form
                  onSubmit={submitConciergeAnswer}
                  className="rounded-xl bg-white p-4"
                >
                  <label className="text-sm font-semibold text-slate-950">
                    Customer answer: {currentQuestion.label}
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                    placeholder={currentQuestion.placeholder}
                    required
                  />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={conciergeLoading}
                      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {conciergeLoading ? "Saving..." : "Save answer"}
                    </button>
                    <button
                      type="button"
                      disabled={conciergeLoading}
                      onClick={() => setAnswer(currentQuestion.sampleAnswer)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Use sample answer
                    </button>
                  </div>
                </form>
              )}

              {selectedCall.conciergeIntake.status !== "IN_PROGRESS" && (
                <div className="rounded-xl bg-white p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Intake summary
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {selectedCall.conciergeIntake.summary}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {selectedCall.conciergeIntake.nextAction}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${conciergeStatusClassName(
                        selectedCall.conciergeIntake.status
                      )}`}
                    >
                      {getConciergeStatusLabel(
                        selectedCall.conciergeIntake.status
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Intent
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedCall.conciergeIntake.intent || "Not set"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Urgency
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedCall.conciergeIntake.urgency || "Not set"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Preferred time
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedCall.conciergeIntake.preferredTime ||
                          "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Scheduling rule
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedCall.conciergeIntake.schedulingMode}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Quote request
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedCall.conciergeIntake.quoteRequested
                          ? "Detected"
                          : "Not detected"}
                      </p>
                    </div>
                  </div>

                  {selectedCall.conciergeIntake.quoteGuidance && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-800">
                        Quote guard rail
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {selectedCall.conciergeIntake.quoteGuidance}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
