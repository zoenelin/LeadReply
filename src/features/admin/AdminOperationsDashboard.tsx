"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { DemoResetButton } from "@/components/DemoResetButton"
import { AdminAiCommunicationsSection } from "@/features/admin/AdminAiCommunicationsSection"
import { AdminMissedCallAssistantReviewSection } from "@/features/admin/AdminMissedCallAssistantReviewSection"
import { AdminIntegrationsSection } from "@/features/admin/AdminIntegrationsSection"
import { AdminJobsSection } from "@/features/admin/AdminJobsSection"
import {
  Badge,
  EmptyState,
  Field,
  formatDate,
  formatDateTime,
  formatMoney,
  InlineSelect,
  MetricCard,
  PriorityBadge,
  readForm,
  SelectField,
} from "@/features/admin/admin-ui"
import { opsJobStatuses } from "@/lib/domain/status"
import type { AdminOperationsDashboardData } from "@/services/admin/operations"
import {
  adminBillingStatuses,
  adminContentStatuses,
  adminGrowthTaskCategories,
  adminGrowthTaskSources,
  adminGrowthTaskStatuses,
  adminMarketingChannels,
  internalAssignmentCategories,
  internalAssignmentStatuses,
  internalNoteCategories,
  internalPriorities,
  internalWorkerRoles,
  internalWorkerStatuses,
  labelFromValue,
} from "@/services/admin/options"

type AdminOperationsDashboardProps = {
  data: AdminOperationsDashboardData
}

type MutationMethod = "POST" | "PATCH"

function actionClassName(tone: "amber" | "rose" | "emerald" | "slate") {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
    rose: "border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
    slate: "border-lr-border bg-lr-surface text-lr-strong hover:bg-lr-hover",
  }

  return tones[tone]
}

export function AdminOperationsDashboard({
  data,
}: AdminOperationsDashboardProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loadingKey, setLoadingKey] = useState("")

  const activeWorkers = useMemo(
    () => data.workers.filter((worker) => worker.status === "ACTIVE"),
    [data.workers]
  )
  const failedJobCount = data.opsJobs.filter(
    (job) => job.status === opsJobStatuses.failed
  ).length
  const runningJobCount = data.opsJobs.filter(
    (job) =>
      job.status === opsJobStatuses.queued ||
      job.status === opsJobStatuses.running ||
      job.status === opsJobStatuses.retrying
  ).length
  const missingRequiredProviderCount = data.integrationStatuses.filter(
    (item) => item.required && !item.configured
  ).length
  const waitingClientCount = data.businesses.filter(
    (business) => !business.onboardingComplete
  ).length
  const unassignedWorkCount = data.assignments.filter(
    (assignment) => !assignment.worker
  ).length
  const operatorActions = [
    {
      label: "Launch",
      title:
        missingRequiredProviderCount > 0
          ? `${missingRequiredProviderCount} provider blocker${
              missingRequiredProviderCount === 1 ? "" : "s"
            }`
          : "Provider checks clear",
      detail:
        missingRequiredProviderCount > 0
          ? "Connect required production services before live traffic."
          : "Required integrations are configured from the current env.",
      href: "#integrations",
      tone: missingRequiredProviderCount > 0 ? "amber" : "emerald",
    },
    {
      label: "Clients",
      title: `${waitingClientCount} setup ${
        waitingClientCount === 1 ? "account" : "accounts"
      }`,
      detail: "Finish onboarding or mark clients complete when setup is done.",
      href: "#clients",
      tone: waitingClientCount > 0 ? "amber" : "slate",
    },
    {
      label: "Automation",
      title:
        failedJobCount > 0
          ? `${failedJobCount} failed job${failedJobCount === 1 ? "" : "s"}`
          : `${runningJobCount} active job${runningJobCount === 1 ? "" : "s"}`,
      detail:
        failedJobCount > 0
          ? "Review failures and retry safe queued jobs."
          : "Queued and running automation is visible in Jobs.",
      href: "#jobs",
      tone: failedJobCount > 0 ? "rose" : "slate",
    },
    {
      label: "AI Review",
      title: `${data.counts.missedCallAssistantReviews} intake${
        data.counts.missedCallAssistantReviews === 1 ? "" : "s"
      }`,
      detail:
        data.counts.missedCallAssistantReviews > 0
          ? "Approve or edit LeadReply missed-call assistant summaries before they become final."
          : "No missed-call missed-call assistant intakes are waiting for review.",
      href: "#ai-review",
      tone: data.counts.missedCallAssistantReviews > 0 ? "amber" : "slate",
    },
    {
      label: "Team",
      title: `${unassignedWorkCount} unassigned ${
        unassignedWorkCount === 1 ? "task" : "tasks"
      }`,
      detail: "Assign owner, SEO, marketing, and support work before it piles up.",
      href: "#work",
      tone: unassignedWorkCount > 0 ? "amber" : "slate",
    },
    {
      label: "Approvals",
      title: `${data.counts.contentDrafts} draft${
        data.counts.contentDrafts === 1 ? "" : "s"
      }`,
      detail: "Review marketing content that is waiting for approval.",
      href: "#approvals",
      tone: data.counts.contentDrafts > 0 ? "amber" : "slate",
    },
  ] as const

  async function mutate(
    path: string,
    payload: Record<string, unknown>,
    method: MutationMethod = "PATCH",
    loadingLabel = "Saving"
  ) {
    setLoadingKey(`${method}:${path}`)
    setError("")
    setMessage("")

    try {
      const res = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body.error || "Something went wrong.")
        return false
      }

      setMessage(loadingLabel)
      router.refresh()
      return true
    } catch {
      setError("Something went wrong.")
      return false
    } finally {
      setLoadingKey("")
    }
  }

  async function submitForm(
    event: FormEvent<HTMLFormElement>,
    path: string,
    successMessage: string
  ) {
    event.preventDefault()
    const form = event.currentTarget
    const payload = readForm(form)
    const ok = await mutate(path, payload, "POST", successMessage)

    if (ok) {
      form.reset()
    }
  }

  function updateBusiness(
    businessId: string,
    field: "selectedPlan" | "billingStatus" | "onboardingComplete",
    value: string
  ) {
    const payload =
      field === "onboardingComplete"
        ? { [field]: value === "true" }
        : { [field]: value }

    void mutate(
      `/api/admin/businesses/${businessId}`,
      payload,
      "PATCH",
      "Client updated."
    )
  }

  return (
    <div className="mt-8">
      <section className="overflow-hidden rounded-3xl border border-lr-border bg-lr-primary text-lr-on-primary shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lr-on-primary/80 ring-1 ring-white/15">
                Admin only
              </span>
              <span className="text-sm font-semibold text-lr-on-primary/75">
                Internal operations portal
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              LeadReply command center
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-lr-on-primary/75">
              Clients, onboarding, assignments, growth work, AI usage,
              integrations, notes, and background-job tracking in one place.
            </p>
          </div>
          <div className="grid content-end gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
              <p className="text-sm font-semibold text-lr-on-primary/75">
                Launch readiness
              </p>
              <p className="mt-2 text-4xl font-black">
                {data.launchReadinessScore}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
              <p className="text-sm font-semibold text-lr-on-primary/75">
                AI spend tracked
              </p>
              <p className="mt-2 text-4xl font-black">
                {formatMoney(data.aiUsageSummary.estimatedCostCents)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav className="mt-5 overflow-x-auto rounded-2xl border border-lr-border bg-lr-surface p-2 text-sm font-bold shadow-sm shadow-lr-shadow/30">
        <div className="flex min-w-max gap-1">
          {[
            ["Clients", "#clients"],
            ["Work", "#work"],
            ["Growth Ops", "#growth-ops"],
            ["Approvals", "#approvals"],
            ["AI Review", "#ai-review"],
            ["AI", "#ai"],
            ["Integrations", "#integrations"],
            ["Security", "#security"],
            ["Team", "#team"],
            ["Jobs", "#jobs"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-xl px-4 py-3 text-lr-muted transition hover:bg-lr-hover hover:text-lr-strong"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {(message || error || loadingKey) && (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
            error
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message || "Saving..."}
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Paying clients"
          value={data.counts.businesses}
          detail={`${data.counts.totalBusinesses} total businesses, ${data.counts.users} owner accounts`}
        />
        <MetricCard
          label="Open work"
          value={data.counts.openAssignments}
          detail={`${data.counts.workers} internal workers`}
        />
        <MetricCard
          label="Captured leads"
          value={data.counts.leads}
          detail={`${data.counts.missedCalls} missed calls`}
        />
        <MetricCard
          label="Content drafts"
          value={data.counts.contentDrafts}
          detail="Waiting for approval or scheduling"
        />
        <MetricCard
          label="AI logs"
          value={data.counts.aiUsageLogs}
          detail={`${data.aiUsageSummary.inputTokens + data.aiUsageSummary.outputTokens} tokens`}
        />
        <MetricCard
          label="AI reviews"
          value={data.counts.missedCallAssistantReviews}
          detail="Missed-call assistant intakes needing approval"
        />
        <MetricCard
          label="Security events"
          value={data.counts.securityEvents}
          detail="Failed or blocked account actions"
        />
      </section>

      <section className="mt-6 rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Operator next actions
            </p>
            <h2 className="mt-2 text-2xl font-black text-lr-strong">
              What needs attention before the next client touch.
            </h2>
          </div>
          <span className="text-sm font-bold text-lr-subtle">
            {data.launchReadinessScore}% launch readiness
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {operatorActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className={`rounded-2xl border p-4 transition ${actionClassName(
                action.tone
              )}`}
            >
              <p className="text-xs font-black uppercase tracking-wide opacity-70">
                {action.label}
              </p>
              <p className="mt-2 text-xl font-black">{action.title}</p>
              <p className="mt-2 text-xs leading-5 opacity-80">
                {action.detail}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section
        id="security"
        className="mt-8 rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Security
            </p>
            <h2 className="mt-2 text-2xl font-black text-lr-strong">
              Recent account activity
            </h2>
            <p className="mt-2 text-sm text-lr-muted">
              Password, signup, billing, and admin account changes that matter
              for support and launch safety.
            </p>
          </div>
          <span className="text-sm font-bold text-lr-subtle">
            {data.securityEvents.length} recent events
          </span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {data.securityEvents.length === 0 ? (
            <EmptyState message="No security events have been recorded yet." />
          ) : (
            data.securityEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {labelFromValue(event.type)}
                  </p>
                  <Badge value={event.outcome} />
                </div>
                <p className="mt-2 text-sm text-lr-muted">
                  {event.summary || "Security event recorded."}
                </p>
                <p className="mt-2 text-xs font-semibold text-lr-subtle">
                  {event.actorEmail || event.user?.email || "System"}{" "}
                  {event.business ? `- ${event.business.name}` : ""}
                </p>
                <p className="mt-1 text-xs font-semibold text-lr-subtle">
                  {formatDateTime(event.createdAt)}
                  {event.ipAddress ? ` - ${event.ipAddress}` : ""}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section id="clients" className="mt-8 rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Clients
            </p>
            <h2 className="mt-2 text-2xl font-black text-lr-strong">
              Business accounts
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link
              href="/settings/launch"
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-lr-body hover:bg-lr-hover"
            >
              Launch checklist
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-lr-primary px-4 py-3 text-lr-on-primary hover:bg-lr-primary-hover"
            >
              Owner dashboard
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {data.businesses.length === 0 ? (
            <EmptyState message="No businesses have signed up yet." />
          ) : (
            data.businesses.map((business) => (
              <article
                key={business.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-lr-strong">
                        {business.name}
                      </h3>
                      <Badge
                        value={
                          business.onboardingComplete
                            ? "ACTIVE"
                            : "WAITING_ON_CLIENT"
                        }
                      />
                    </div>
                    <p className="mt-1 text-sm font-medium text-lr-muted">
                      {business.user.email}
                    </p>
                    <Link
                      href={`/admin/clients/${business.id}`}
                      className="mt-3 inline-flex rounded-xl bg-lr-primary px-4 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
                    >
                      Open client
                    </Link>
                    <p className="mt-1 text-sm text-lr-muted">
                      Business phone: {business.phone || "Not set"}
                    </p>
                    <p className="mt-1 text-sm text-lr-muted">
                      Contact: {business.contactName || "Not set"}{" "}
                      {business.contactPhonePrimary || business.contactPhoneSecondary
                        ? `- ${[
                            business.contactPhonePrimary,
                            business.contactPhoneSecondary,
                          ]
                            .filter(Boolean)
                            .join(" / ")}`
                        : ""}
                    </p>
                    {(business.city || business.state) && (
                      <p className="mt-2 text-sm text-lr-subtle">
                        {[business.city, business.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-xl bg-lr-surface-muted p-3">
                        <p className="font-black text-lr-strong">
                          {business._count.leads}
                        </p>
                        <p className="text-lr-subtle">Leads</p>
                      </div>
                      <div className="rounded-xl bg-lr-surface-muted p-3">
                        <p className="font-black text-lr-strong">
                          {business._count.growthTasks}
                        </p>
                        <p className="text-lr-subtle">Growth</p>
                      </div>
                      <div className="rounded-xl bg-lr-surface-muted p-3">
                        <p className="font-black text-lr-strong">
                          {business._count.websiteAuditRuns}
                        </p>
                        <p className="text-lr-subtle">Audits</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <Field label="Billing">
                      <InlineSelect
                        label={`Billing for ${business.name}`}
                        value={business.billingStatus}
                        options={adminBillingStatuses}
                        onChange={(value) =>
                          updateBusiness(business.id, "billingStatus", value)
                        }
                      />
                    </Field>
                    <Field label="Onboarding">
                      <select
                        aria-label={`Onboarding for ${business.name}`}
                        value={String(business.onboardingComplete)}
                        onChange={(event) =>
                          updateBusiness(
                            business.id,
                            "onboardingComplete",
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm font-semibold text-lr-body"
                      >
                        <option value="false">In progress</option>
                        <option value="true">Complete</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between rounded-xl bg-lr-surface-muted px-3 py-2">
                      <span className="text-lr-subtle">Reviews</span>
                      <span className="font-bold text-lr-strong">
                        {business._count.reviewRequests}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-lr-surface-muted px-3 py-2">
                      <span className="text-lr-subtle">Marketing</span>
                      <span className="font-bold text-lr-strong">
                        {business._count.marketingCalendarItems}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-lr-surface-muted px-3 py-2">
                      <span className="text-lr-subtle">AI logs</span>
                      <span className="font-bold text-lr-strong">
                        {business._count.aiUsageLogs}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-lr-surface-muted px-3 py-2">
                      <span className="text-lr-subtle">Ops notes</span>
                      <span className="font-bold text-lr-strong">
                        {business._count.internalClientNotes}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-4">
        <form
          onSubmit={(event) =>
            submitForm(event, "/api/admin/workers", "Worker created.")
          }
          className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30"
        >
          <h2 className="text-xl font-black text-lr-strong">Add worker</h2>
          <div className="mt-5 space-y-4">
            <Field label="Name">
              <input
                name="name"
                required
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </Field>
            <Field label="Role">
              <SelectField name="role" options={internalWorkerRoles} />
            </Field>
          </div>
          <button
            type="submit"
            disabled={Boolean(loadingKey)}
            className="mt-5 w-full rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            Create worker
          </button>
        </form>

        <form
          onSubmit={(event) =>
            submitForm(event, "/api/admin/assignments", "Assignment created.")
          }
          className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 xl:col-span-2"
        >
          <h2 className="text-xl font-black text-lr-strong">
            Assign client work
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Client">
              <select
                name="businessId"
                required
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
              >
                <option value="">Select a client</option>
                {data.businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Worker">
              <select
                name="workerId"
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
              >
                <option value="">Unassigned</option>
                {activeWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name || worker.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                name="title"
                required
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </Field>
            <Field label="Due date">
              <input
                name="dueAt"
                type="date"
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </Field>
            <Field label="Category">
              <SelectField
                name="category"
                options={internalAssignmentCategories}
              />
            </Field>
            <Field label="Priority">
              <SelectField name="priority" options={internalPriorities} />
            </Field>
            <label className="block md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Description
              </span>
              <textarea
                name="description"
                rows={3}
                className="mt-2 w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={Boolean(loadingKey)}
            className="mt-5 rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            Create assignment
          </button>
        </form>

        <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30">
          <h2 className="text-xl font-black text-lr-strong">Admin actions</h2>
          <div className="mt-5 grid gap-3 text-sm font-bold">
            <Link
              href="/growth"
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-lr-body hover:bg-lr-hover"
            >
              SEO module
            </Link>
            <Link
              href="/growth"
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-lr-body hover:bg-lr-hover"
            >
              Marketing module
            </Link>
            <Link
              href="/settings/billing"
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-lr-body hover:bg-lr-hover"
            >
              Billing setup
            </Link>
            <Link
              href="/dashboard#money-made"
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-lr-body hover:bg-lr-hover"
            >
              Snapshot reporting
            </Link>
            <DemoResetButton />
          </div>
        </div>
      </section>

      <section id="work" className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
                Work
              </p>
              <h2 className="mt-2 text-2xl font-black text-lr-strong">
                Internal assignments
              </h2>
            </div>
            <span className="text-sm font-bold text-lr-subtle">
              {data.assignments.length} visible
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {data.assignments.length === 0 ? (
              <EmptyState message="No internal assignments yet." />
            ) : (
              data.assignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-lr-strong">
                          {assignment.title}
                        </h3>
                        <PriorityBadge value={assignment.priority} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-lr-muted">
                        {assignment.business.name} -{" "}
                        {assignment.worker?.name ||
                          assignment.worker?.email ||
                          "Unassigned"}
                      </p>
                      {assignment.description && (
                        <p className="mt-2 text-sm leading-6 text-lr-muted">
                          {assignment.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs font-semibold text-lr-subtle">
                        {labelFromValue(assignment.category)} - due{" "}
                        {formatDate(assignment.dueAt)}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 lg:w-96">
                      <InlineSelect
                        label={`Status for ${assignment.title}`}
                        value={assignment.status}
                        options={internalAssignmentStatuses}
                        onChange={(value) =>
                          void mutate(
                            `/api/admin/assignments/${assignment.id}`,
                            { status: value },
                            "PATCH",
                            "Assignment updated."
                          )
                        }
                      />
                      <InlineSelect
                        label={`Priority for ${assignment.title}`}
                        value={assignment.priority}
                        options={internalPriorities}
                        onChange={(value) =>
                          void mutate(
                            `/api/admin/assignments/${assignment.id}`,
                            { priority: value },
                            "PATCH",
                            "Assignment updated."
                          )
                        }
                      />
                      <select
                        aria-label={`Worker for ${assignment.title}`}
                        value={assignment.worker?.id ?? ""}
                        onChange={(event) =>
                          void mutate(
                            `/api/admin/assignments/${assignment.id}`,
                            { workerId: event.target.value },
                            "PATCH",
                            "Assignment updated."
                          )
                        }
                        className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold text-lr-body"
                      >
                        <option value="">Unassigned</option>
                        {activeWorkers.map((worker) => (
                          <option key={worker.id} value={worker.id}>
                            {worker.name || worker.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30">
            <h2 className="text-xl font-black text-lr-strong">
              Growth tasks
            </h2>
            <div className="mt-5 space-y-3">
              {data.growthTasks.length === 0 ? (
                <EmptyState message="No open growth tasks." />
              ) : (
                data.growthTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-lr-border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-lr-strong">{task.title}</p>
                      <PriorityBadge value={task.priority} />
                    </div>
                    <p className="mt-1 text-sm text-lr-muted">
                      {task.business.name} - {labelFromValue(task.category)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30">
            <h2 className="text-xl font-black text-lr-strong">
              Audit and setup flags
            </h2>
            <div className="mt-5 space-y-3">
              {[...data.serviceOpportunities, ...data.websiteAuditFindings]
                .slice(0, 10)
                .map((item) => (
                  <div
                    key={`${"type" in item ? "opportunity" : "finding"}-${item.id}`}
                    className="rounded-2xl border border-lr-border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-lr-strong">{item.title}</p>
                      {"priority" in item ? (
                        <PriorityBadge value={item.priority} />
                      ) : (
                        <PriorityBadge value={item.severity} />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-lr-muted">
                      {item.business.name}
                    </p>
                  </div>
                ))}
              {data.serviceOpportunities.length === 0 &&
                data.websiteAuditFindings.length === 0 && (
                  <EmptyState message="No open audit or setup flags." />
                )}
            </div>
          </div>
        </div>
      </section>

      <section id="growth-ops" className="mt-8 grid gap-5 xl:grid-cols-2">
        <form
          onSubmit={(event) =>
            submitForm(event, "/api/admin/growth-tasks", "Growth task created.")
          }
          className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Growth ops
            </p>
            <h2 className="mt-2 text-2xl font-black text-lr-strong">
              Create SEO or marketing task
            </h2>
            <p className="mt-2 text-sm leading-6 text-lr-muted">
              Manual tasks live in the same queue as automated audit and growth
              plan tasks, so early hands-on work does not become throwaway.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Client">
              <select
                name="businessId"
                required
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
              >
                <option value="">Select a client</option>
                {data.businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <SelectField
                name="category"
                options={adminGrowthTaskCategories}
              />
            </Field>
            <Field label="Title">
              <input
                name="title"
                required
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="Write service-area page brief"
              />
            </Field>
            <Field label="Due date">
              <input
                name="dueAt"
                type="date"
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </Field>
            <Field label="Status">
              <SelectField name="status" options={adminGrowthTaskStatuses} />
            </Field>
            <Field label="Priority">
              <SelectField name="priority" options={internalPriorities} />
            </Field>
            <Field label="Source">
              <SelectField name="source" options={adminGrowthTaskSources} />
            </Field>
            <label className="block md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Description
              </span>
              <textarea
                name="description"
                rows={4}
                className="mt-2 w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="What should be researched, written, optimized, or reviewed?"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={Boolean(loadingKey)}
            className="mt-5 rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            Create task
          </button>
        </form>

        <form
          onSubmit={(event) =>
            submitForm(
              event,
              "/api/admin/marketing-calendar",
              "Marketing draft created."
            )
          }
          className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Marketing ops
            </p>
            <h2 className="mt-2 text-2xl font-black text-lr-strong">
              Create content draft
            </h2>
            <p className="mt-2 text-sm leading-6 text-lr-muted">
              Draft social, email, GBP, website, or local SEO work manually
              now; later automation can create the same approval-ready items.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Client">
              <select
                name="businessId"
                required
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
              >
                <option value="">Select a client</option>
                {data.businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Channel">
              <SelectField name="channel" options={adminMarketingChannels} />
            </Field>
            <Field label="Title">
              <input
                name="title"
                required
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="June tune-up promotion"
              />
            </Field>
            <Field label="Scheduled for">
              <input
                name="scheduledFor"
                type="date"
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </Field>
            <Field label="Goal">
              <input
                name="campaignGoal"
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="More booked estimates"
              />
            </Field>
            <Field label="Theme">
              <input
                name="contentTheme"
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="Seasonal service reminder"
              />
            </Field>
            <Field label="Offer">
              <input
                name="offer"
                className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="Optional promo or offer"
              />
            </Field>
            <Field label="Status">
              <SelectField name="status" options={adminContentStatuses} />
            </Field>
            <label className="block md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Notes or draft copy
              </span>
              <textarea
                name="notes"
                rows={4}
                className="mt-2 w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
                placeholder="Draft copy, creative direction, approval notes, or next steps."
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={Boolean(loadingKey)}
            className="mt-5 rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            Create draft
          </button>
        </form>
      </section>

      <section id="approvals" className="mt-8 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Marketing
            </p>
            <h2 className="mt-2 text-2xl font-black text-lr-strong">
              Content approval queue
            </h2>
          </div>
          <div className="mt-6 space-y-3">
            {data.contentDrafts.length === 0 ? (
              <EmptyState message="No content drafts waiting right now." />
            ) : (
              data.contentDrafts.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_13rem] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-lr-strong">
                          {item.title}
                        </h3>
                        <Badge value={item.status} />
                      </div>
                      <p className="mt-1 text-sm text-lr-muted">
                        {item.business.name} - {item.channel || "No channel"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-lr-muted">
                        {item.campaignGoal || item.contentTheme || item.notes}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-lr-subtle">
                        Scheduled {formatDate(item.scheduledFor)}
                      </p>
                    </div>
                    <InlineSelect
                      label={`Status for ${item.title}`}
                      value={item.status}
                      options={adminContentStatuses}
                      onChange={(value) =>
                        void mutate(
                          `/api/admin/content-drafts/${item.id}`,
                          { status: value },
                          "PATCH",
                          "Content updated."
                        )
                      }
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <form
          onSubmit={(event) =>
            submitForm(event, "/api/admin/client-notes", "Note added.")
          }
          className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
        >
          <h2 className="text-xl font-black text-lr-strong">
            Add internal note
          </h2>
          <div className="mt-5 space-y-4">
            <Field label="Client">
              <select
                name="businessId"
                required
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
              >
                <option value="">Select a client</option>
                {data.businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Worker">
              <select
                name="workerId"
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
              >
                <option value="">No worker</option>
                {activeWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name || worker.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <SelectField name="category" options={internalNoteCategories} />
            </Field>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Note
              </span>
              <textarea
                name="body"
                required
                rows={5}
                className="mt-2 w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={Boolean(loadingKey)}
            className="mt-5 rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            Add note
          </button>
        </form>
      </section>

      <AdminMissedCallAssistantReviewSection intakes={data.missedCallAssistantReviewQueue} />

      <AdminAiCommunicationsSection
        aiUsageSummary={data.aiUsageSummary}
        aiUsageLogs={data.aiUsageLogs}
        smsMessages={data.smsMessages}
      />

      <AdminIntegrationsSection
        integrationStatuses={data.integrationStatuses}
        emailLogs={data.emailLogs}
      />

      <section id="team" className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
            Team
          </p>
          <h2 className="mt-2 text-2xl font-black text-lr-strong">
            Internal workers
          </h2>
          <div className="mt-6 space-y-3">
            {data.workers.length === 0 ? (
              <EmptyState message="No internal workers have been added." />
            ) : (
              data.workers.map((worker) => (
                <article
                  key={worker.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-black text-lr-strong">
                        {worker.name || worker.email}
                      </h3>
                      <p className="mt-1 text-sm text-lr-muted">
                        {worker.email}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-lr-subtle">
                        {worker._count.assignments} assignments -{" "}
                        {worker._count.clientNotes} notes
                      </p>
                    </div>
                    <div className="grid gap-2 sm:w-44">
                      <InlineSelect
                        label={`Role for ${worker.email}`}
                        value={worker.role}
                        options={internalWorkerRoles}
                        onChange={(value) =>
                          void mutate(
                            `/api/admin/workers/${worker.id}`,
                            { role: value },
                            "PATCH",
                            "Worker updated."
                          )
                        }
                      />
                      <InlineSelect
                        label={`Status for ${worker.email}`}
                        value={worker.status}
                        options={internalWorkerStatuses}
                        onChange={(value) =>
                          void mutate(
                            `/api/admin/workers/${worker.id}`,
                            { status: value },
                            "PATCH",
                            "Worker updated."
                          )
                        }
                      />
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
          <h2 className="text-xl font-black text-lr-strong">
            Internal notes
          </h2>
          <div className="mt-5 space-y-3">
            {data.internalNotes.length === 0 ? (
              <EmptyState message="No internal notes yet." />
            ) : (
              data.internalNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-lr-strong">
                      {note.business.name}
                    </p>
                    <Badge value={note.category} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-lr-body">
                    {note.body}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-lr-subtle">
                    {note.authorEmail || note.worker?.email || "Internal"} -{" "}
                    {formatDate(note.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <AdminJobsSection
        businesses={data.businesses}
        opsJobs={data.opsJobs}
        loading={Boolean(loadingKey)}
        mutate={mutate}
        submitForm={submitForm}
      />

      <p className="mt-8 text-center text-xs font-semibold text-lr-subtle">
        Last refreshed {formatDate(data.generatedAt)}.
      </p>
    </div>
  )
}
