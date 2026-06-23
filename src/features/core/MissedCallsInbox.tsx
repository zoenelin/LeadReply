"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  missedCallAssistantStatusClassName,
  type MissedCallAssistantAnswerMap,
  type MissedCallAssistantTranscriptEntry,
  getMissedCallAssistantPlan,
  getMissedCallAssistantStatusLabel,
} from "@/services/modules/core"
import { formatResponseDuration, minutesBetween } from "@/services/modules/analytics"
import {
  communicationStatuses,
  missedCallAssistantStatuses,
  missedCallStatuses,
} from "@/lib/domain/status"

type MissedCallAssistantIntakeRecord = {
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
  matchedServiceName: string
  matchedQuoteLowCents: number
  matchedQuoteHighCents: number
  matchedDurationMinutes: number
  serviceBookableOnline: boolean
  availabilityGuidance: string
  summary: string
  nextAction: string
  transcript: MissedCallAssistantTranscriptEntry[]
  answers: MissedCallAssistantAnswerMap
  aiProvider: string
  aiModel: string
  aiError: string
  leadId: string | null
}

type MissedCallSmsMessage = {
  id: string
  direction: string
  status: string
  providerMessageId: string | null
  body: string
  purpose: string
  error: string
  createdAt: string
  sentAt: string | null
  deliveredAt: string | null
  failedAt: string | null
  receivedAt: string | null
}

type MissedCallRoutingAttempt = {
  id: string
  routedToPhoneNumber: string
  routeLabel: string
  routeOrder: number
  status: string
  completedAt: string | null
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
  smsMessages: MissedCallSmsMessage[]
  routingAttempts: MissedCallRoutingAttempt[]
  missedCallAssistantIntake: MissedCallAssistantIntakeRecord | null
}

type MissedCallsInboxProps = {
  calls: MissedCall[]
  replyTemplate: string
  businessName: string
  businessType: string
  bookingAutomationEnabled: boolean
}

type InboxFilter = "ALL" | "NEEDS_REPLY" | "REPLIED" | "AI" | "LEAD"
type InboxSort =
  | "NEWEST"
  | "OLDEST"
  | "WAITING_LONGEST"
  | "NEEDS_REPLY"
  | "AI_FIRST"
  | "LEADS_FIRST"

export function MissedCallsInbox({
  calls,
  replyTemplate,
  businessName,
  businessType,
  bookingAutomationEnabled,
}: MissedCallsInboxProps) {
  const [localCalls, setLocalCalls] = useState(calls)
  const [selectedCallId, setSelectedCallId] = useState("")
  const [message, setMessage] = useState("")
  const [listPanePercent, setListPanePercent] = useState(34)
  const [isResizing, setIsResizing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<InboxFilter>("ALL")
  const [sortBy, setSortBy] = useState<InboxSort>("NEWEST")
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const selectedCall = useMemo(
    () => localCalls.find((call) => call.id === selectedCallId) ?? null,
    [localCalls, selectedCallId]
  )
  const visibleCalls = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return localCalls
      .filter((call) => {
        const matchesFilter =
          filterBy === "ALL" ||
          (filterBy === "NEEDS_REPLY" &&
            call.status !== missedCallStatuses.replied) ||
          (filterBy === "REPLIED" &&
            call.status === missedCallStatuses.replied) ||
          (filterBy === "AI" && Boolean(call.missedCallAssistantIntake)) ||
          (filterBy === "LEAD" && Boolean(call.convertedLeadId))

        if (!matchesFilter) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const smsText = call.smsMessages
          .map((message) => message.body)
          .join(" ")
        const searchableText = [
          call.callerName,
          call.callerPhone,
          call.reason,
          call.missedCallAssistantIntake?.summary ?? "",
          call.missedCallAssistantIntake?.nextAction ?? "",
          smsText,
        ]
          .join(" ")
          .toLowerCase()

        return searchableText.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftCreated = new Date(left.createdAt).getTime()
        const rightCreated = new Date(right.createdAt).getTime()

        if (sortBy === "OLDEST") {
          return leftCreated - rightCreated
        }

        if (sortBy === "WAITING_LONGEST") {
          const leftReplied = left.status === missedCallStatuses.replied
          const rightReplied = right.status === missedCallStatuses.replied

          if (leftReplied !== rightReplied) {
            return leftReplied ? 1 : -1
          }

          return leftCreated - rightCreated
        }

        if (sortBy === "NEEDS_REPLY") {
          const leftNeedsReply = left.status !== missedCallStatuses.replied
          const rightNeedsReply = right.status !== missedCallStatuses.replied

          if (leftNeedsReply !== rightNeedsReply) {
            return leftNeedsReply ? -1 : 1
          }

          return rightCreated - leftCreated
        }

        if (sortBy === "AI_FIRST") {
          const leftHasAi = Boolean(left.missedCallAssistantIntake)
          const rightHasAi = Boolean(right.missedCallAssistantIntake)

          if (leftHasAi !== rightHasAi) {
            return leftHasAi ? -1 : 1
          }

          return rightCreated - leftCreated
        }

        if (sortBy === "LEADS_FIRST") {
          const leftHasLead = Boolean(left.convertedLeadId)
          const rightHasLead = Boolean(right.convertedLeadId)

          if (leftHasLead !== rightHasLead) {
            return leftHasLead ? -1 : 1
          }

          return rightCreated - leftCreated
        }

        return rightCreated - leftCreated
      })
  }, [filterBy, localCalls, searchTerm, sortBy])
  const missedCallAssistantPlan = selectedCall
    ? getMissedCallAssistantPlan({
        businessName,
        businessType,
        callerName: selectedCall.callerName,
        bookingAutomationEnabled,
      })
    : null
  const currentQuestion =
    selectedCall?.missedCallAssistantIntake?.status === missedCallAssistantStatuses.inProgress &&
    missedCallAssistantPlan
      ? missedCallAssistantPlan.questions[selectedCall.missedCallAssistantIntake.currentStep]
      : null

  const updatePaneWidth = useCallback((clientX: number) => {
    const container = splitContainerRef.current

    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    const nextPercent = ((clientX - rect.left) / rect.width) * 100
    const constrainedPercent = Math.min(62, Math.max(22, nextPercent))

    setListPanePercent(constrainedPercent)
  }, [])

  function startResizing(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsResizing(true)
    updatePaneWidth(event.clientX)
  }

  function resizeWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      setListPanePercent((current) => Math.max(22, current - 3))
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      setListPanePercent((current) => Math.min(62, current + 3))
    }

    if (event.key === "Home") {
      event.preventDefault()
      setListPanePercent(22)
    }

    if (event.key === "End") {
      event.preventDefault()
      setListPanePercent(62)
    }
  }

  useEffect(() => {
    if (!isResizing) {
      return
    }

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect

    function handlePointerMove(event: PointerEvent) {
      updatePaneWidth(event.clientX)
    }

    function stopResizing() {
      setIsResizing(false)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopResizing)

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopResizing)
    }
  }, [isResizing, updatePaneWidth])

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

  function getLatestSmsMessage(call: MissedCall) {
    return call.smsMessages[call.smsMessages.length - 1] ?? null
  }

  function getSmsStatusText(call: MissedCall) {
    const latest = getLatestSmsMessage(call)

    if (!latest) {
      return "No SMS activity yet"
    }

    if (latest.direction === "INBOUND") {
      return `Customer replied ${new Date(latest.createdAt).toLocaleString()}`
    }

    if (latest.status === communicationStatuses.failed) {
      return "Last text failed"
    }

    if (latest.status === communicationStatuses.delivered) {
      return "Last text delivered"
    }

    if (latest.status === communicationStatuses.sent) {
      return "Last text sent"
    }

    return `Last text ${latest.status.toLowerCase()}`
  }

  function formatRouteStatus(status: string) {
    const normalized = status.trim().toLowerCase()

    if (normalized === "no-answer") {
      return "No answer"
    }

    if (normalized === "busy") {
      return "Busy"
    }

    if (normalized === "failed") {
      return "Failed"
    }

    if (normalized === "canceled") {
      return "Canceled"
    }

    if (normalized === "completed" || normalized === "answered") {
      return "Answered"
    }

    return status || "Unknown"
  }

  function smsStatusClassName(status: string) {
    if (
      status === communicationStatuses.delivered ||
      status === communicationStatuses.sent ||
      status === communicationStatuses.received
    ) {
      return "bg-emerald-50 text-emerald-700"
    }

    if (status === communicationStatuses.failed) {
      return "bg-rose-50 text-rose-700"
    }

    return "bg-sky-50 text-sky-700"
  }

  function formatSmsTime(message: MissedCallSmsMessage) {
    const value =
      message.deliveredAt ??
      message.sentAt ??
      message.receivedAt ??
      message.failedAt ??
      message.createdAt

    return new Date(value).toLocaleString()
  }

  function getSchedulingLabel(intake: MissedCallAssistantIntakeRecord) {
    if (!intake.schedulingRequested) {
      return "No preferred time collected"
    }

    if (intake.serviceBookableOnline) {
      return "Can check configured availability"
    }

    return "Owner should confirm time"
  }

  function getQuoteLabel(intake: MissedCallAssistantIntakeRecord) {
    if (!intake.quoteRequested) {
      return "No quote requested"
    }

    if (intake.matchedQuoteLowCents > 0 || intake.matchedQuoteHighCents > 0) {
      return "Use configured estimate only"
    }

    return "Owner should confirm quote"
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
      body: JSON.stringify({ status: missedCallStatuses.replied }),
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
              status: missedCallStatuses.replied,
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
        ? "This missed call is already in Customers/Jobs."
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

  if (localCalls.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-lr-border p-6">
        <p className="text-sm text-lr-muted">No missed calls yet.</p>
      </div>
    )
  }

  return (
    <div
      ref={splitContainerRef}
      className="mt-6 flex flex-col gap-4 lg:h-[calc(100vh-250px)] lg:min-h-[660px] lg:flex-row"
    >
      <div
        className="flex min-w-0 flex-col rounded-2xl border border-lr-border bg-lr-surface p-4 lg:h-full lg:min-w-72 lg:flex-none lg:basis-[var(--inbox-list-width)] lg:overflow-hidden"
        style={
          {
            "--inbox-list-width": `${listPanePercent}%`,
          } as React.CSSProperties
        }
      >
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-lr-subtle">Missed calls</p>
            <p className="mt-1 text-xs font-semibold text-lr-subtle">
              {visibleCalls.length} of {localCalls.length} caller
              {localCalls.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-2xl bg-lr-surface-muted p-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-lr-subtle">
            Search inbox
          </label>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Name, phone, reason, SMS, or AI notes"
            className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm outline-none transition focus:border-lr-strong"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-lr-subtle">
              Filter
              <select
                value={filterBy}
                onChange={(event) =>
                  setFilterBy(event.target.value as InboxFilter)
                }
                className="mt-1 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold normal-case tracking-normal text-lr-strong outline-none transition focus:border-lr-strong"
              >
                <option value="ALL">All calls</option>
                <option value="NEEDS_REPLY">Needs reply</option>
                <option value="REPLIED">Replied</option>
                <option value="AI">Assistant active</option>
                <option value="LEAD">Converted to lead</option>
              </select>
            </label>

            <label className="block text-xs font-bold uppercase tracking-wide text-lr-subtle">
              Sort
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as InboxSort)}
                className="mt-1 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold normal-case tracking-normal text-lr-strong outline-none transition focus:border-lr-strong"
              >
                <option value="NEWEST">Newest first</option>
                <option value="OLDEST">Oldest first</option>
                <option value="WAITING_LONGEST">Waiting longest</option>
                <option value="NEEDS_REPLY">Needs reply first</option>
                <option value="AI_FIRST">Assistant first</option>
                <option value="LEADS_FIRST">Leads first</option>
              </select>
            </label>
          </div>

          {(searchTerm || filterBy !== "ALL" || sortBy !== "NEWEST") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("")
                setFilterBy("ALL")
                setSortBy("NEWEST")
              }}
              className="text-xs font-bold text-lr-muted hover:text-lr-strong"
            >
              Reset inbox view
            </button>
          )}
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto lg:pr-1">
          {visibleCalls.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lr-border-strong bg-lr-surface-muted px-4 py-5 text-sm text-lr-muted">
              No missed calls match this search or filter.
            </div>
          ) : (
          visibleCalls.map((call) => (
            <button
              key={call.id}
              type="button"
              onClick={() => {
                setSelectedCallId(call.id)
                setMessage("")
              }}
              className={`w-full rounded-xl border p-4 text-left ${
                selectedCall?.id === call.id
                  ? "border-lr-strong bg-lr-surface-muted"
                  : "border-lr-border bg-lr-surface hover:bg-lr-hover"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-lr-strong">
                    {call.callerName}
                  </p>
                  <p className="mt-1 text-sm text-lr-muted">
                    {call.callerPhone}
                  </p>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    call.status === missedCallStatuses.replied
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {call.status === missedCallStatuses.replied
                    ? "Replied"
                    : "New"}
                </span>
                {call.convertedLeadId && (
                  <span className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                    Lead
                  </span>
                )}
                {call.missedCallAssistantIntake && (
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${missedCallAssistantStatusClassName(
                      call.missedCallAssistantIntake.status
                    )}`}
                  >
                    AI
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-lr-muted">{call.reason}</p>
              <p className="mt-3 text-xs font-semibold text-lr-subtle">
                {getCallResponseText(call)}
              </p>
              <p className="mt-1 text-xs font-semibold text-lr-subtle">
                {getSmsStatusText(call)}
              </p>
            </button>
          ))
          )}
        </div>
      </div>

      <div
        role="separator"
        aria-label="Resize inbox panes"
        aria-orientation="vertical"
        aria-valuemin={22}
        aria-valuemax={62}
        aria-valuenow={Math.round(listPanePercent)}
        tabIndex={0}
        title="Resize inbox panes"
        onPointerDown={startResizing}
        onDoubleClick={() => setListPanePercent(34)}
        onKeyDown={resizeWithKeyboard}
        className={`hidden w-4 flex-none cursor-col-resize items-center justify-center rounded-full outline-none transition lg:flex ${
          isResizing ? "bg-lr-hover-strong" : "hover:bg-lr-hover focus:bg-lr-hover"
        }`}
      >
        <span className="h-16 w-1 rounded-full bg-lr-border-strong" />
      </div>

      {selectedCall ? (
      <div className="min-w-0 rounded-2xl border border-lr-border bg-lr-surface p-6 lg:h-full lg:flex-1 lg:overflow-y-auto">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-lr-subtle">Selected call</p>
            <h2 className="mt-2 text-2xl font-bold text-lr-strong">
              {selectedCall.callerName}
            </h2>
            <p className="mt-1 text-lr-muted">{selectedCall.callerPhone}</p>
            <p className="mt-1 text-sm text-lr-subtle">
              {new Date(selectedCall.createdAt).toLocaleString()}
            </p>
            <p className="mt-3 inline-flex rounded-lg bg-lr-hover px-3 py-1 text-sm font-semibold text-lr-body">
              {getCallResponseText(selectedCall)}
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-lr-surface-muted p-4 text-sm text-lr-body">
          {selectedCall.reason}
        </p>

        <div className="mt-6 rounded-2xl border border-lr-border p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-lr-subtle">
                Routing attempts
              </p>
              <h3 className="mt-1 text-lg font-bold text-lr-strong">
                {selectedCall.routingAttempts.length > 0
                  ? `${selectedCall.routingAttempts.length} phone${
                      selectedCall.routingAttempts.length === 1 ? "" : "s"
                    } tried`
                  : "No routing attempts recorded"}
              </h3>
            </div>
            <span className="w-fit rounded-lg bg-lr-hover px-3 py-1 text-xs font-semibold text-lr-body">
              Before text-back
            </span>
          </div>

          {selectedCall.routingAttempts.length === 0 ? (
            <p className="mt-4 rounded-xl bg-lr-surface-muted p-4 text-sm text-lr-muted">
              Attempts will appear here after Twilio routes a real call through
              LeadReply.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {selectedCall.routingAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex flex-col justify-between gap-2 rounded-xl bg-lr-surface-muted p-3 text-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-lr-strong">
                      {attempt.routeOrder + 1}.{" "}
                      {attempt.routeLabel || "Routing phone"}
                    </p>
                    <p className="mt-1 text-lr-muted">
                      {attempt.routedToPhoneNumber}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-lr-strong">
                      {formatRouteStatus(attempt.status)}
                    </p>
                    {attempt.completedAt && (
                      <p className="mt-1 text-xs font-semibold text-lr-subtle">
                        {new Date(attempt.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-lr-border p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-lr-subtle">
                SMS conversation
              </p>
              <h3 className="mt-1 text-lg font-bold text-lr-strong">
                {getSmsStatusText(selectedCall)}
              </h3>
            </div>
            <span className="w-fit rounded-lg bg-lr-hover px-3 py-1 text-xs font-semibold text-lr-body">
              {selectedCall.smsMessages.length} message
              {selectedCall.smsMessages.length === 1 ? "" : "s"}
            </span>
          </div>

          {selectedCall.smsMessages.length === 0 ? (
            <p className="mt-4 rounded-xl bg-lr-surface-muted p-4 text-sm text-lr-muted">
              Texts will appear here after the missed-call assistant sends the first reply
              or the customer responds.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedCall.smsMessages.map((sms) => (
                <div
                  key={sms.id}
                  className={`rounded-xl p-4 text-sm ${
                    sms.direction === "INBOUND"
                      ? "bg-lr-surface-muted text-lr-strong"
                      : "bg-lr-primary text-lr-on-primary"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {sms.direction === "INBOUND" ? "Customer" : "LeadReply"}
                    </p>
                    <span
                      className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${smsStatusClassName(
                        sms.status
                      )}`}
                    >
                      {sms.status}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{sms.body}</p>
                  <p className="mt-2 text-xs font-semibold opacity-70">
                    {formatSmsTime(sms)}
                    {sms.providerMessageId
                      ? ` - ${sms.providerMessageId}`
                      : ""}
                  </p>
                  {sms.error && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      {sms.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-lr-border p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-lr-subtle">
              Reply ready to send
            </p>
            <span className="rounded-lg bg-lr-hover px-3 py-1 text-xs font-semibold text-lr-body">
              Draft
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-lr-strong">
            {replyTemplate}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
                LeadReply missed-call assistant
              </p>
              <h3 className="mt-2 text-xl font-bold text-lr-strong">
                {selectedCall.missedCallAssistantIntake
                  ? getMissedCallAssistantStatusLabel(selectedCall.missedCallAssistantIntake.status)
                  : "Intake ready"}
              </h3>
              <p className="mt-2 text-sm text-lr-body">
                LeadReply texts missed callers automatically, collects their
                answers, and shows the owner what needs attention.
              </p>
            </div>
            <span className="w-fit rounded-lg bg-lr-surface px-3 py-1 text-xs font-semibold text-lr-body">
              {selectedCall.missedCallAssistantIntake?.aiProvider === "OPENAI"
                ? "OpenAI enhanced"
                : "Review rules on"}
            </span>
          </div>

          {!selectedCall.missedCallAssistantIntake && (
            <div className="mt-5 rounded-xl bg-lr-surface p-4">
              <p className="text-sm font-medium text-lr-subtle">
                Automatic first text
              </p>
              <p className="mt-2 text-sm text-lr-body">
                {missedCallAssistantPlan?.openingMessage}
              </p>
              <p className="mt-2 text-sm font-semibold text-lr-strong">
                {missedCallAssistantPlan?.questions[0]?.prompt}
              </p>
              <p className="mt-4 rounded-lg bg-lr-surface-muted px-3 py-2 text-xs font-semibold text-lr-muted">
                This starts automatically when a real missed-call webhook is
                received. Sample calls may show this preview until phone routing
                is connected.
              </p>
            </div>
          )}

          {selectedCall.missedCallAssistantIntake && (
            <div className="mt-5 space-y-4">
              <div className="space-y-3">
                {selectedCall.missedCallAssistantIntake.transcript.map((entry, index) => (
                  <div
                    key={`${entry.createdAt}-${index}`}
                    className={`rounded-xl p-4 text-sm ${
                      entry.role === "customer"
                        ? "bg-lr-surface text-lr-strong"
                        : "bg-lr-primary text-lr-on-primary"
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
                <div className="rounded-xl bg-lr-surface p-4">
                  <p className="text-sm font-semibold text-lr-strong">
                    Waiting for customer reply
                  </p>
                  <p className="mt-2 text-sm text-lr-body">
                    LeadReply has asked: {currentQuestion.prompt}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-lr-muted">
                    The next step updates here after the customer replies by
                    text.
                  </p>
                </div>
              )}

              {selectedCall.missedCallAssistantIntake.status !==
                missedCallAssistantStatuses.inProgress && (
                <div className="rounded-xl bg-lr-surface p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-medium text-lr-subtle">
                        Intake summary
                      </p>
                      <p className="mt-2 font-semibold text-lr-strong">
                        {selectedCall.missedCallAssistantIntake.summary}
                      </p>
                      <p className="mt-2 text-sm text-lr-body">
                        {selectedCall.missedCallAssistantIntake.nextAction}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${missedCallAssistantStatusClassName(
                        selectedCall.missedCallAssistantIntake.status
                      )}`}
                    >
                      {getMissedCallAssistantStatusLabel(
                        selectedCall.missedCallAssistantIntake.status
                      )}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">
                      Safe owner decision
                    </p>
                    <p className="mt-1 text-sm text-lr-strong">
                      Confirm the next step before promising a booked time or a
                      final quote. LeadReply can collect intent and preferences,
                      but the owner stays in control of commitments.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-lr-surface-muted p-3">
                      <p className="text-xs font-medium text-lr-subtle">
                        Intent
                      </p>
                      <p className="mt-1 text-sm font-semibold text-lr-strong">
                        {selectedCall.missedCallAssistantIntake.intent || "Not set"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-lr-surface-muted p-3">
                      <p className="text-xs font-medium text-lr-subtle">
                        Urgency
                      </p>
                      <p className="mt-1 text-sm font-semibold text-lr-strong">
                        {selectedCall.missedCallAssistantIntake.urgency || "Not set"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-lr-surface-muted p-3">
                      <p className="text-xs font-medium text-lr-subtle">
                        Preferred time
                      </p>
                      <p className="mt-1 text-sm font-semibold text-lr-strong">
                        {getSchedulingLabel(selectedCall.missedCallAssistantIntake)}
                      </p>
                      <p className="mt-1 text-xs text-lr-subtle">
                      {selectedCall.missedCallAssistantIntake.preferredTime ||
                          "No customer preference yet"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-lr-surface-muted p-3">
                      <p className="text-xs font-medium text-lr-subtle">
                        Scheduling status
                      </p>
                      <p className="mt-1 text-sm font-semibold text-lr-strong">
                        {selectedCall.missedCallAssistantIntake.schedulingMode}
                      </p>
                    </div>
                    <div className="rounded-lg bg-lr-surface-muted p-3">
                      <p className="text-xs font-medium text-lr-subtle">
                        Quote request
                      </p>
                      <p className="mt-1 text-sm font-semibold text-lr-strong">
                        {getQuoteLabel(selectedCall.missedCallAssistantIntake)}
                      </p>
                    </div>
                  </div>

                  {selectedCall.missedCallAssistantIntake.quoteGuidance && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-800">
                        Quote guidance
                      </p>
                      <p className="mt-1 text-sm text-lr-strong">
                        {selectedCall.missedCallAssistantIntake.quoteGuidance}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg bg-lr-surface p-3">
                    <p className="text-xs font-medium text-lr-subtle">
                      Service match
                    </p>
                    <p className="mt-1 text-sm font-semibold text-lr-strong">
                      {selectedCall.missedCallAssistantIntake.matchedServiceName ||
                        "No configured service matched"}
                    </p>
                    {selectedCall.missedCallAssistantIntake.matchedServiceName && (
                      <p className="mt-2 text-sm text-lr-body">
                        {selectedCall.missedCallAssistantIntake.matchedDurationMinutes >
                        0
                          ? `${selectedCall.missedCallAssistantIntake.matchedDurationMinutes} minutes`
                          : "Duration not set"}
                        {" - "}
                        {selectedCall.missedCallAssistantIntake.serviceBookableOnline
                          ? "Bookable from connected schedule"
                          : "Owner confirmation required"}
                      </p>
                    )}
                  </div>

                  {selectedCall.missedCallAssistantIntake.aiError && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-800">
                        AI fallback
                      </p>
                      <p className="mt-1 text-sm text-lr-strong">
                        {selectedCall.missedCallAssistantIntake.aiError}
                      </p>
                    </div>
                  )}

                  {selectedCall.missedCallAssistantIntake.availabilityGuidance && (
                    <div className="mt-4 rounded-lg bg-lr-surface p-3">
                      <p className="text-xs font-medium text-lr-subtle">
                        Availability guidance
                      </p>
                      <p className="mt-1 text-sm text-lr-body">
                        {selectedCall.missedCallAssistantIntake.availabilityGuidance}
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
            disabled={selectedCall.status === missedCallStatuses.replied}
            className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {selectedCall.status === missedCallStatuses.replied
              ? "Already replied"
              : "Mark as replied"}
          </button>
          <button
            type="button"
            onClick={copyReply}
            className="rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
          >
            Copy reply
          </button>
          <button
            type="button"
            onClick={convertToLead}
            disabled={Boolean(selectedCall.convertedLeadId)}
            className="rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {selectedCall.convertedLeadId
              ? "Already in Customers/Jobs"
              : "Convert to lead"}
          </button>
          {selectedCall.convertedLeadId && (
            <Link
              href={`/leads/${selectedCall.convertedLeadId}`}
              className="inline-flex items-center justify-center rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
            >
              Open record
            </Link>
          )}
        </div>

        {message && <p className="mt-4 text-sm text-lr-muted">{message}</p>}
      </div>
      ) : (
        <div className="min-w-0 rounded-2xl border border-dashed border-lr-border-strong bg-lr-surface-muted p-6 lg:h-full lg:flex-1">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-lr-subtle">
                No call selected
              </p>
              <h2 className="mt-2 text-2xl font-bold text-lr-strong">
                Choose a missed call to review
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-lr-muted">
                The reply draft, SMS conversation, LeadReply missed-call assistant intake, and lead
                conversion tools will appear here after you click a caller.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
