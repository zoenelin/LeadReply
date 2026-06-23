"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { GrowthPlanRecommendation } from "@/services/ai/growth-plan"

type SerializedAuditFinding = {
  id: string
  category: string
  severity: string
  title: string
  description: string
  recommendation: string
  status: string
}

type SerializedAuditRun = {
  id: string
  targetUrl: string
  status: string
  score: number
  summary: string
  checkedAt: string
  findings: SerializedAuditFinding[]
}

type SerializedServiceOpportunity = {
  id: string
  type: string
  title: string
  description: string
  status: string
  priority: string
  estimatedValueCents: number
}

type SerializedGrowthPlan = {
  id: string
  title: string
  summary: string
  status: string
  source: string
  aiProvider: string
  aiModel: string
  aiError: string
  recommendations: GrowthPlanRecommendation[]
  createdAt: string
}

type GrowthAutomationPanelProps = {
  website: string
  auditRuns: SerializedAuditRun[]
  serviceOpportunities: SerializedServiceOpportunity[]
  growthPlans: SerializedGrowthPlan[]
  aiUsageCount: number
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatMoney(cents: number) {
  return currencyFormatter.format(cents / 100)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "No date"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function badgeClassName(value: string) {
  if (value === "HIGH" || value === "ERROR") {
    return "bg-rose-50 text-rose-700"
  }

  if (value === "LOW" || value === "RULES") {
    return "bg-lr-hover text-lr-body"
  }

  if (value === "OPENAI" || value === "SUCCESS") {
    return "bg-emerald-50 text-emerald-700"
  }

  return "bg-amber-50 text-amber-700"
}

export function GrowthAutomationPanel({
  website,
  auditRuns,
  serviceOpportunities,
  growthPlans,
  aiUsageCount,
}: GrowthAutomationPanelProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loadingAction, setLoadingAction] = useState<
    "audit" | "plan" | ""
  >("")
  const latestAudit = auditRuns[0]
  const latestPlan = growthPlans[0]
  const openOpportunities = serviceOpportunities.filter(
    (opportunity) => opportunity.status === "OPEN"
  )

  async function postAction(url: string, action: "audit" | "plan") {
    setLoadingAction(action)
    setMessage("")

    try {
      const res = await fetch(url, {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(
        data.message ||
          (action === "audit"
            ? "Website audit queued. Check Admin Jobs for worker status."
            : "Growth plan queued. Check Admin Jobs for worker status.")
      )
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoadingAction("")
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-lr-border p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Deep audit and AI-ready plan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-lr-strong">
              Turn presence data into growth work
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-lr-muted">
              Start with a permission-based website audit, then generate a
              growth plan from the business memory, audit findings, leads, SEO,
              and marketing details.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <button
              type="button"
              onClick={() => postAction("/api/website-audits/run", "audit")}
              disabled={!website || loadingAction !== ""}
              className="rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
            >
              {loadingAction === "audit" ? "Queueing..." : "Run website audit"}
            </button>
            <button
              type="button"
              onClick={() =>
                postAction("/api/growth-plan/generate", "plan")
              }
              disabled={loadingAction !== ""}
              className="rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover disabled:opacity-60"
            >
              {loadingAction === "plan" ? "Queueing..." : "Generate plan"}
            </button>
          </div>
        </div>
        {!website && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Add a public website URL before running the website audit. If the
            business has no website, use the growth plan to create a future
            website-readiness opportunity instead.
          </p>
        )}
        {message && <p className="mt-4 text-sm text-lr-muted">{message}</p>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-lr-border p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-bold text-lr-strong">
                Latest audit
              </h2>
              <p className="mt-1 text-sm text-lr-muted">
                The audit checks SEO basics, conversion paths, reviews,
                location signals, and mobile readiness.
              </p>
            </div>
            {latestAudit && (
              <div className="rounded-2xl bg-lr-surface-muted px-5 py-4 text-center">
                <p className="text-sm text-lr-subtle">Score</p>
                <p className="mt-1 text-3xl font-bold text-lr-strong">
                  {latestAudit.score}
                </p>
              </div>
            )}
          </div>
          {!latestAudit ? (
            <div className="mt-5 rounded-xl border border-dashed border-lr-border-strong p-6 text-center">
              <p className="font-semibold text-lr-strong">
                No website audit yet.
              </p>
              <p className="mt-2 text-sm text-lr-muted">
                Run the first audit after the website URL is recorded.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-lr-surface-muted p-4">
                <p className="text-sm font-semibold text-lr-strong">
                  {latestAudit.summary}
                </p>
                <p className="mt-1 text-xs text-lr-subtle">
                  {latestAudit.targetUrl} - {formatDate(latestAudit.checkedAt)}
                </p>
              </div>
              {latestAudit.findings.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  No findings were created from this audit.
                </p>
              ) : (
                latestAudit.findings.slice(0, 6).map((finding) => (
                  <article
                    key={finding.id}
                    className="rounded-xl border border-lr-border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lr-strong">
                        {finding.title}
                      </h3>
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${badgeClassName(
                          finding.severity
                        )}`}
                      >
                        {finding.severity.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-lr-muted">
                      {finding.description}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-lr-body">
                      {finding.recommendation}
                    </p>
                  </article>
                ))
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-lr-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-lr-strong">
                Service opportunities
              </h2>
              <p className="mt-1 text-sm text-lr-muted">
                Missing presence pieces can become future setup or management
                packages.
              </p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {openOpportunities.length} open
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {openOpportunities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-lr-border-strong p-6 text-center">
                <p className="font-semibold text-lr-strong">
                  No open service opportunities.
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  Missing digital presence items will appear here after setup is
                  saved.
                </p>
              </div>
            ) : (
              openOpportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-xl border border-lr-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-lr-strong">
                      {opportunity.title}
                    </h3>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${badgeClassName(
                        opportunity.priority
                      )}`}
                    >
                      {opportunity.priority.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-lr-muted">
                    {opportunity.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-lr-body">
                    Potential service value:{" "}
                    {formatMoney(opportunity.estimatedValueCents)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-lr-border p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold text-lr-strong">
              Latest growth plan
            </h2>
            <p className="mt-1 text-sm text-lr-muted">
              Plans are saved as drafts. They also create growth tasks, and
              marketing ideas start in an approval state.
            </p>
          </div>
          <div className="rounded-2xl bg-lr-surface-muted px-5 py-4 text-center">
            <p className="text-sm text-lr-subtle">AI runs logged</p>
            <p className="mt-1 text-2xl font-bold text-lr-strong">
              {aiUsageCount}
            </p>
          </div>
        </div>
        {!latestPlan ? (
          <div className="mt-5 rounded-xl border border-dashed border-lr-border-strong p-6 text-center">
            <p className="font-semibold text-lr-strong">
              No growth plan generated yet.
            </p>
            <p className="mt-2 text-sm text-lr-muted">
              Generate a plan after digital presence and SEO details are saved.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-lr-surface-muted p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-lr-strong">
                  {latestPlan.title}
                </h3>
                <span
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${badgeClassName(
                    latestPlan.aiProvider
                  )}`}
                >
                  {latestPlan.aiProvider === "OPENAI" ? "AI" : "rules"}
                </span>
              </div>
              <p className="mt-2 text-sm text-lr-muted">
                {latestPlan.summary}
              </p>
              {latestPlan.aiError && (
                <p className="mt-2 text-sm text-amber-700">
                  AI fallback note: {latestPlan.aiError}
                </p>
              )}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {latestPlan.recommendations.map((recommendation) => (
                <article
                  key={`${latestPlan.id}-${recommendation.title}`}
                  className="rounded-xl border border-lr-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-lr-strong">
                      {recommendation.title}
                    </h3>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${badgeClassName(
                        recommendation.priority
                      )}`}
                    >
                      {recommendation.priority.toLowerCase()}
                    </span>
                    <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-body">
                      {recommendation.category.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-lr-muted">
                    {recommendation.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-lr-body">
                    {recommendation.suggestedAction}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
