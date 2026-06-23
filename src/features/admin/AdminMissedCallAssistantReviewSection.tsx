"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Badge,
  EmptyState,
  formatDateTime,
  previewText,
} from "@/features/admin/admin-ui"
import { missedCallAssistantReviewStatuses } from "@/lib/domain/status"
import type { AdminOperationsDashboardData } from "@/services/admin/operations"
import { labelFromValue } from "@/services/admin/options"

type MissedCallAssistantReviewItem =
  AdminOperationsDashboardData["missedCallAssistantReviewQueue"][number]

const reviewStatusOptions = [
  missedCallAssistantReviewStatuses.needsReview,
  missedCallAssistantReviewStatuses.changesRequested,
  missedCallAssistantReviewStatuses.approved,
] as const

function readAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return []
  }

  return Object.entries(value)
    .filter(([, answer]) => typeof answer === "string" && answer.trim())
    .map(([key, answer]) => ({
      key,
      answer: String(answer),
    }))
}

function TemplateList({
  label,
  items,
}: {
  label: string
  items: string[]
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-lr-border bg-lr-surface-muted px-3 py-1 text-xs font-semibold text-lr-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function MissedCallAssistantReviewCard({ intake }: { intake: MissedCallAssistantReviewItem }) {
  const router = useRouter()
  const [summary, setSummary] = useState(
    intake.adminReviewSummary || intake.summary || "No summary yet."
  )
  const [nextAction, setNextAction] = useState(
    intake.adminReviewNextAction || intake.nextAction || "No next action yet."
  )
  const [notes, setNotes] = useState(intake.adminReviewNotes || "")
  const [status, setStatus] = useState(intake.adminReviewStatus)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const answers = readAnswers(intake.answers)

  async function saveReview(statusOverride = status) {
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const res = await fetch(
        `/api/admin/missed-call-assistant-intakes/${intake.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: statusOverride,
            summary,
            nextAction,
            notes,
          }),
        }
      )
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body.error || "Could not save review.")
        return
      }

      setStatus(statusOverride)
      setMessage(
        statusOverride === missedCallAssistantReviewStatuses.approved
          ? "missed-call assistant intake approved."
          : "Review saved."
      )
      router.refresh()
    } catch {
      setError("Could not save review.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-2xl border border-lr-border bg-lr-surface p-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr] xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-lr-strong">
              {intake.missedCall.callerName}
            </h3>
            <Badge value={status} />
            <Badge value={intake.urgency || "NO_URGENCY"} />
          </div>
          <p className="mt-1 text-sm font-semibold text-lr-muted">
            {intake.business.name} - {intake.missedCall.callerPhone}
          </p>
          <p className="mt-1 text-xs font-semibold text-lr-subtle">
            Missed {formatDateTime(intake.missedCall.createdAt)} -{" "}
            {intake.template.label} template
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-lr-surface-muted p-3">
              <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                AI summary
              </p>
              <p className="mt-2 text-sm leading-6 text-lr-body">
                {intake.summary || "No AI summary yet."}
              </p>
            </div>
            <div className="rounded-xl bg-lr-surface-muted p-3">
              <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                AI next action
              </p>
              <p className="mt-2 text-sm leading-6 text-lr-body">
                {intake.nextAction || "No AI next action yet."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <TemplateList
              label="Intake focus"
              items={intake.template.intakeFocus}
            />
            <TemplateList
              label="Urgency signals"
              items={intake.template.urgencySignals}
            />
            <TemplateList
              label="Owner review triggers"
              items={intake.template.ownerReviewTriggers}
            />
          </div>

          <div className="mt-4 rounded-xl border border-lr-border p-3">
            <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
              Captured answers
            </p>
            {answers.length === 0 ? (
              <p className="mt-2 text-sm text-lr-muted">
                No answers have been captured yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {answers.map((answer) => (
                  <div
                    key={answer.key}
                    className="rounded-xl bg-lr-surface-muted p-3"
                  >
                    <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                      {labelFromValue(answer.key)}
                    </p>
                    <p className="mt-1 text-sm text-lr-body">
                      {previewText(answer.answer, 160)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-lr-border bg-lr-surface-muted p-4">
          <div className="grid gap-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Review status
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm font-semibold text-lr-body"
              >
                {reviewStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {labelFromValue(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Reviewed summary
              </span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm leading-6 text-lr-body"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Reviewed next action
              </span>
              <textarea
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm leading-6 text-lr-body"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Internal review notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm leading-6 text-lr-body"
                placeholder="What changed, what needs owner review, or what to watch."
              />
            </label>

            {(message || error) && (
              <p
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  error
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {error || message}
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveReview()}
                className="rounded-xl border border-lr-border-strong px-4 py-3 text-sm font-bold text-lr-body hover:bg-lr-hover disabled:opacity-60"
              >
                Save review
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void saveReview(missedCallAssistantReviewStatuses.approved)
                }
                className="rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
              >
                Approve intake
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-sm font-bold">
              {intake.lead ? (
                <Link
                  href={`/leads/${intake.lead.id}`}
                  className="rounded-xl border border-lr-border-strong px-3 py-2 text-lr-body hover:bg-lr-hover"
                >
                  Open customer/job
                </Link>
              ) : null}
              <Link
                href={`/admin/clients/${intake.business.id}`}
                className="rounded-xl border border-lr-border-strong px-3 py-2 text-lr-body hover:bg-lr-hover"
              >
                Open client
              </Link>
            </div>

            {intake.adminReviewedAt && (
              <p className="text-xs font-semibold text-lr-subtle">
                Last reviewed by {intake.adminReviewedByEmail || "Admin"} on{" "}
                {formatDateTime(intake.adminReviewedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export function AdminMissedCallAssistantReviewSection({
  intakes,
}: {
  intakes: MissedCallAssistantReviewItem[]
}) {
  return (
    <section
      id="ai-review"
      className="mt-8 rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
            LeadReply missed-call assistant review
          </p>
          <h2 className="mt-2 text-2xl font-black text-lr-strong">
            Missed-call intakes waiting for human approval
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-lr-muted">
            Review the AI summary before a customer-facing quote, schedule,
            promise, or owner handoff gets treated as final.
          </p>
        </div>
        <span className="text-sm font-bold text-lr-subtle">
          {intakes.length} visible
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {intakes.length === 0 ? (
          <EmptyState message="No LeadReply missed-call assistant intakes need review right now." />
        ) : (
          intakes.map((intake) => (
            <MissedCallAssistantReviewCard key={intake.id} intake={intake} />
          ))
        )}
      </div>
    </section>
  )
}
