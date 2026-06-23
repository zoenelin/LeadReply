"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type GrowthFocus = "seo" | "marketing" | "growth"

type SerializedGrowthTask = {
  id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  dueAt: string
  createdAt: string
}

type SerializedMarketingCalendarItem = {
  id: string
  title: string
  channel: string
  campaignGoal: string
  contentTheme: string
  offer: string
  status: string
  scheduledFor: string
  notes: string
  createdAt: string
}

type ReadinessItem = {
  label: string
  ready: boolean
  summary: string
}

type GrowthRequestBoardProps = {
  focus: GrowthFocus
  accessAllowed: boolean
  planLabel: string
  readinessItems: ReadinessItem[]
  growthTasks: SerializedGrowthTask[]
  marketingCalendarItems: SerializedMarketingCalendarItem[]
  latestAudit: {
    score: number
    summary: string
    checkedAt: string
  } | null
  latestPlan: {
    title: string
    summary: string
    source: string
    createdAt: string
  } | null
}

type RequestOption = {
  value: string
  label: string
  description: string
  category: "PRESENCE" | "SEO" | "MARKETING" | "GENERAL"
  priority: "HIGH" | "MEDIUM" | "LOW"
}

const seoRequestOptions: RequestOption[] = [
  {
    value: "seo-audit",
    label: "Request a local SEO audit",
    description:
      "Review website basics, Google profile readiness, local search signals, and conversion gaps.",
    category: "SEO",
    priority: "HIGH",
  },
  {
    value: "google-profile",
    label: "Request Google Business Profile help",
    description:
      "Ask LeadReply to review, clean up, or plan improvements for the Google listing.",
    category: "PRESENCE",
    priority: "HIGH",
  },
  {
    value: "keywords",
    label: "Request keyword research",
    description:
      "Ask LeadReply to find local service keywords and avoid terms that are too crowded.",
    category: "SEO",
    priority: "MEDIUM",
  },
  {
    value: "seo-other",
    label: "Request something else",
    description: "Send LeadReply a plain-language SEO request.",
    category: "SEO",
    priority: "MEDIUM",
  },
]

const marketingRequestOptions: RequestOption[] = [
  {
    value: "campaign",
    label: "Request a campaign",
    description:
      "Ask LeadReply to plan a promotion, seasonal push, or awareness campaign.",
    category: "MARKETING",
    priority: "HIGH",
  },
  {
    value: "social",
    label: "Request social posts",
    description:
      "Ask LeadReply to draft professional posts for the best-fit social channels.",
    category: "MARKETING",
    priority: "MEDIUM",
  },
  {
    value: "email",
    label: "Request email or repeat-customer outreach",
    description:
      "Ask LeadReply to create a simple customer outreach idea or draft.",
    category: "MARKETING",
    priority: "MEDIUM",
  },
  {
    value: "marketing-other",
    label: "Request something else",
    description: "Send LeadReply a plain-language marketing request.",
    category: "MARKETING",
    priority: "MEDIUM",
  },
]

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    TODO: "Requested",
    IN_PROGRESS: "In progress",
    DONE: "Done",
    DRAFT: "Draft",
    NEEDS_APPROVAL: "Needs approval",
    SCHEDULED: "Approved",
    POSTED: "Posted",
  }

  return labels[status] ?? status
}

function statusClassName(status: string) {
  if (status === "DONE" || status === "SCHEDULED" || status === "POSTED") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "IN_PROGRESS") {
    return "bg-sky-50 text-sky-700"
  }

  if (status === "NEEDS_APPROVAL") {
    return "bg-amber-50 text-amber-700"
  }

  return "bg-lr-hover text-lr-body"
}

function formatDate(value: string) {
  if (!value) {
    return "No date"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "No date"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function GrowthRequestBoard({
  focus,
  accessAllowed,
  planLabel,
  readinessItems,
  growthTasks,
  marketingCalendarItems,
  latestAudit,
  latestPlan,
}: GrowthRequestBoardProps) {
  const router = useRouter()
  const requestOptions =
    focus === "seo"
      ? seoRequestOptions
      : focus === "marketing"
        ? marketingRequestOptions
        : [...seoRequestOptions, ...marketingRequestOptions]
  const [selectedRequest, setSelectedRequest] = useState(
    requestOptions[0]?.value ?? ""
  )
  const [details, setDetails] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const selectedOption =
    requestOptions.find((option) => option.value === selectedRequest) ??
    requestOptions[0]
  const filteredTasks = useMemo(
    () =>
      growthTasks.filter((task) =>
        focus === "growth"
          ? ["SEO", "PRESENCE", "MARKETING", "GENERAL"].includes(task.category)
          : focus === "seo"
          ? task.category === "SEO" || task.category === "PRESENCE"
          : task.category === "MARKETING"
      ),
    [focus, growthTasks]
  )
  const approvals = marketingCalendarItems.filter(
    (item) => item.status === "NEEDS_APPROVAL"
  )
  const openRequestCount = filteredTasks.filter(
    (task) => task.status !== "DONE"
  ).length
  const inProgressCount = filteredTasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length
  const readyCount = readinessItems.filter((item) => item.ready).length

  async function createRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedOption) {
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/growth-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedOption.label,
          description: details.trim() || selectedOption.description,
          category: selectedOption.category,
          priority: selectedOption.priority,
          source: "MANUAL",
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not send the request.")
        return
      }

      setDetails("")
      setMessage("Request sent to LeadReply.")
      router.refresh()
    } catch {
      setMessage("Could not send the request right now.")
    } finally {
      setLoading(false)
    }
  }

  async function updateApproval(id: string, status: "DRAFT" | "SCHEDULED") {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/marketing-calendar/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not update approval.")
        return
      }

      setMessage(status === "SCHEDULED" ? "Draft approved." : "Draft returned.")
      router.refresh()
    } catch {
      setMessage("Could not update approval right now.")
    } finally {
      setLoading(false)
    }
  }

  if (!accessAllowed) {
    return (
      <div className="mt-8 rounded-2xl border border-lr-border bg-lr-surface p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
          {focus === "marketing" ? "Marketing add-on" : "Growth add-on"}
        </p>
        <h2 className="mt-2 text-2xl font-black text-lr-strong">
          Available on {planLabel}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-lr-muted">
          LeadReply keeps the CRM simple first. This module turns into a request
          and approval workspace after the business chooses the matching growth
          plan.
        </p>
        <Link
          href="/settings/billing"
          className="mt-5 inline-flex rounded-xl bg-lr-primary px-5 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
        >
          Review plans
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-bold text-lr-subtle">Open requests</p>
          <p className="mt-2 text-3xl font-black text-lr-strong">
            {openRequestCount}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-bold text-lr-subtle">In progress</p>
          <p className="mt-2 text-3xl font-black text-lr-strong">
            {inProgressCount}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-bold text-lr-subtle">Needs approval</p>
          <p className="mt-2 text-3xl font-black text-lr-strong">
            {focus === "seo" ? 0 : approvals.length}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-bold text-lr-subtle">Info ready</p>
          <p className="mt-2 text-3xl font-black text-lr-strong">
            {readyCount}/{readinessItems.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={createRequest}
          className="rounded-2xl border border-lr-border p-5"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Ask LeadReply
          </p>
          <h2 className="mt-2 text-2xl font-black text-lr-strong">
            {focus === "seo"
              ? "Request SEO work"
              : focus === "marketing"
                ? "Request marketing work"
                : "Request growth work"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-lr-muted">
            Write it like you would text a person. LeadReply can handle the
            planning, automation, drafts, and manual work behind the scenes.
          </p>

          <label className="mt-5 block text-sm font-bold text-lr-body">
            Request type
            <select
              value={selectedRequest}
              onChange={(event) => setSelectedRequest(event.target.value)}
              className="mt-2 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm outline-none focus:border-lr-strong"
            >
              {requestOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {selectedOption && (
            <p className="mt-3 rounded-xl bg-lr-surface-muted p-3 text-sm text-lr-muted">
              {selectedOption.description}
            </p>
          )}

          <label className="mt-4 block text-sm font-bold text-lr-body">
            Anything LeadReply should know?
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className="mt-2 min-h-32 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm outline-none focus:border-lr-strong"
              placeholder={
                focus === "seo"
                  ? "Example: We want to rank better for emergency plumbing in Green Bay."
                  : focus === "marketing"
                    ? "Example: We want a spring tune-up campaign ready before April."
                    : "Example: We want more local calls and a simple seasonal campaign."
              }
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send request"}
          </button>
          {message && <p className="mt-3 text-sm font-semibold text-lr-muted">{message}</p>}
        </form>

        <section className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Work status
          </p>
          <h2 className="mt-2 text-2xl font-black text-lr-strong">
            Requests and approvals
          </h2>

          {focus !== "seo" && approvals.length > 0 && (
            <div className="mt-5 space-y-3">
              {approvals.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p className="font-bold text-lr-strong">{item.title}</p>
                      <p className="mt-1 text-sm text-lr-body">
                        {item.channel || "Marketing draft"}{" "}
                        {item.scheduledFor
                          ? `- planned for ${formatDate(item.scheduledFor)}`
                          : ""}
                      </p>
                      {item.notes && (
                        <p className="mt-3 text-sm text-lr-muted">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateApproval(item.id, "SCHEDULED")}
                        className="rounded-lg bg-lr-primary px-3 py-2 text-xs font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateApproval(item.id, "DRAFT")}
                        className="rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 text-xs font-bold text-lr-body hover:bg-lr-hover disabled:opacity-60"
                      >
                        Needs changes
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-lr-border-strong p-6 text-center">
                <p className="font-bold text-lr-strong">
                  No requests yet
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  Send the first request and LeadReply will track it here.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-lr-border p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lr-strong">
                          {task.title}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                            task.status
                          )}`}
                        >
                          {statusLabel(task.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-lr-muted">
                        {task.description || "No details added."}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-lr-subtle">
                      {task.dueAt ? formatDate(task.dueAt) : formatDate(task.createdAt)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-bold text-lr-subtle">
            {focus === "seo" ? "Latest audit" : "Latest growth work"}
          </p>
          {(focus === "seo" || focus === "growth") && latestAudit ? (
            <>
              <p className="mt-2 text-3xl font-black text-lr-strong">
                {latestAudit.score}/100
              </p>
              <p className="mt-2 text-sm text-lr-muted">
                {latestAudit.summary}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-lr-subtle">
                {formatDate(latestAudit.checkedAt)}
              </p>
            </>
          ) : latestPlan ? (
            <>
              <p className="mt-2 text-lg font-black text-lr-strong">
                {latestPlan.title}
              </p>
              <p className="mt-2 text-sm text-lr-muted">
                {latestPlan.summary}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-lr-subtle">
                {latestPlan.source.toLowerCase()} - {formatDate(latestPlan.createdAt)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-lr-muted">
              Results will appear here after LeadReply starts work.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-lr-border p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-bold text-lr-subtle">Missing info</p>
            <Link
              href="/settings/automation"
              className="text-sm font-bold text-lr-body hover:text-lr-strong"
            >
              Update in Settings
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {readinessItems.filter((item) => !item.ready).length === 0 ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                LeadReply has the key info needed for this module.
              </p>
            ) : (
              readinessItems
                .filter((item) => !item.ready)
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-lr-surface-muted px-4 py-3"
                  >
                    <p className="text-sm font-bold text-lr-strong">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-lr-muted">
                      {item.summary}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
