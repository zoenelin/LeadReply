"use client"

import { useState } from "react"

type LeadQualityFactor = {
  label: string
  points: number
}

type LeadQualityMetricsCardProps = {
  score: number
  label: string
  reason: string
  factors: LeadQualityFactor[]
}

const scoringAreas = [
  "Customer engagement",
  "Source type",
  "Estimated job value",
  "Service fit",
  "Quote intent",
  "Scheduling intent",
  "Follow-up state",
  "Lead freshness",
]

export function LeadQualityTooltip() {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="What lead quality means"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-lr-border-strong bg-lr-surface text-xs font-bold text-lr-muted hover:border-lr-border-strong hover:text-lr-strong"
      >
        i
      </button>
      {open && (
        <span className="absolute right-0 top-8 z-20 w-72 rounded-xl border border-lr-border bg-lr-surface p-3 text-left text-xs font-medium leading-5 text-lr-muted shadow-xl">
          Lead quality is a 0-100 signal score. It helps decide which customer
          opportunity deserves attention first using engagement, source,
          estimated job value, service fit, quote intent, scheduling intent,
          follow-up risk, and freshness. It is guidance, not a guarantee.
        </span>
      )}
    </span>
  )
}

export function LeadQualityMetricsCard({
  score,
  label,
  reason,
  factors,
}: LeadQualityMetricsCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-lr-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-lr-subtle">Lead quality</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {score}/100
          </p>
          <p className="mt-1 text-sm font-semibold text-lr-body">{label}</p>
        </div>
        <LeadQualityTooltip />
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-lr-border bg-lr-surface-muted px-4 py-3 text-sm font-semibold text-lr-body hover:border-lr-border-strong hover:bg-lr-hover"
      >
        <span>{expanded ? "Hide metrics" : "Show metrics"}</span>
        <span aria-hidden="true">{expanded ? "^" : "v"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-lr-muted">{reason}</p>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
              Scoring areas
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {scoringAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-lg bg-lr-hover px-2.5 py-1 text-xs font-semibold text-lr-muted"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-lr-surface-muted px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-lr-body">
                  Starting score
                </span>
                <span className="block text-xs text-lr-subtle">
                  Every lead starts with a neutral baseline before signals are
                  added or removed.
                </span>
              </span>
              <span className="text-sm font-bold text-lr-strong">35</span>
            </div>

            {factors.length === 0 ? (
              <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted">
                No scoring signals have been recorded yet.
              </div>
            ) : (
              factors.map((factor) => (
                <div
                  key={factor.label}
                  className="flex items-center justify-between gap-4 rounded-xl bg-lr-surface-muted px-4 py-3"
                >
                  <span className="text-sm font-medium text-lr-body">
                    {factor.label}
                  </span>
                  <span
                    className={
                      factor.points < 0
                        ? "text-sm font-bold text-rose-700"
                        : "text-sm font-bold text-lr-strong"
                    }
                  >
                    {factor.points > 0 ? "+" : ""}
                    {factor.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
