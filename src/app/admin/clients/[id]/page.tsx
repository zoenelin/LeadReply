import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { AppNav } from "@/components/AppNav"
import {
  Badge,
  EmptyState,
  formatDate,
  formatDateTime,
  formatMoney,
  MetricCard,
  previewText,
  PriorityBadge,
} from "@/features/admin/admin-ui"
import { isAdminEmail } from "@/lib/security/admin"
import {
  getAdminClientDetail,
  type AdminClientDetailData,
} from "@/services/admin/operations"
import { labelFromValue } from "@/services/admin/options"

export const metadata: Metadata = {
  title: "Admin Client Detail",
  description:
    "Internal LeadReply client detail page for setup, activity, automation, and account health.",
  robots: {
    index: false,
    follow: false,
  },
}

type AdminClientPageProps = {
  params: Promise<{
    id: string
  }>
}

function percent(part: number, total: number) {
  if (total === 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

function actionClassName(tone: string) {
  if (tone === "rose") {
    return "border-rose-200 bg-rose-50 text-rose-950"
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-950"
  }

  return "border-lr-border bg-lr-surface text-lr-strong"
}

function SectionHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string
  title: string
  detail?: string
}) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black text-lr-strong">{title}</h2>
      {detail && <p className="mt-2 text-sm text-lr-muted">{detail}</p>}
    </div>
  )
}

function SetupChecklist({
  data,
}: {
  data: AdminClientDetailData
}) {
  return (
    <section
      id="setup"
      className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
    >
      <SectionHeader
        eyebrow="Setup"
        title="Client readiness"
        detail="Internal view of what is ready before this account handles real customer volume."
      />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {data.setupChecks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="rounded-2xl border border-lr-border p-4 hover:bg-lr-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-lr-strong">{item.label}</p>
                <p className="mt-1 text-sm text-lr-muted">{item.summary}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  item.ready
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {item.ready ? "Ready" : "Needs setup"}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function ClientProfile({
  data,
}: {
  data: AdminClientDetailData
}) {
  const { business } = data

  return (
    <section
      id="profile"
      className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
    >
      <SectionHeader
        eyebrow="Profile"
        title="Business and contact information"
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-lr-surface-muted p-4">
          <p className="text-sm font-bold text-lr-strong">Business</p>
          <div className="mt-3 space-y-2 text-sm text-lr-muted">
            <p>{business.name}</p>
            <p>{business.phone || "Business phone not set"}</p>
            <p>
              {[business.address, business.city, business.state, business.zip]
                .filter(Boolean)
                .join(", ") || "Address not set"}
            </p>
            <p>{business.website || "Website not set"}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-lr-surface-muted p-4">
          <p className="text-sm font-bold text-lr-strong">Owner contact</p>
          <div className="mt-3 space-y-2 text-sm text-lr-muted">
            <p>{data.ownerEmail}</p>
            <p>{business.contactName || "Contact name not set"}</p>
            <p>
              {[business.contactPhonePrimary, business.contactPhoneSecondary]
                .filter(Boolean)
                .join(" / ") || "Contact phone not set"}
            </p>
            <p>Preferred: {labelFromValue(business.preferredContactMethod)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CoreActivity({
  data,
}: {
  data: AdminClientDetailData
}) {
  const { business } = data

  return (
    <section
      id="activity"
      className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
    >
      <SectionHeader
        eyebrow="Lead flow"
        title="Lead capture and missed-call activity"
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-lg font-black text-lr-strong">Recent leads</h3>
          <div className="mt-4 space-y-3">
            {business.leads.length === 0 ? (
              <EmptyState message="No leads captured for this client yet." />
            ) : (
              business.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block rounded-2xl border border-lr-border p-4 hover:bg-lr-hover"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-lr-strong">
                          {lead.customerName}
                        </p>
                        <Badge value={lead.status} />
                      </div>
                      <p className="mt-1 text-sm text-lr-muted">
                        {lead.customerPhone} - {labelFromValue(lead.source)}
                      </p>
                      <p className="mt-2 text-sm text-lr-muted">
                        {previewText(
                          lead.missedCallAssistantIntakes[0]?.nextAction ||
                            lead.followUpNote ||
                            lead.notes ||
                            "No next action saved."
                        )}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-lr-strong">
                      {formatMoney(
                        lead.capturedValueCents || lead.estimatedValueCents
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-black text-lr-strong">
            Missed calls and intakes
          </h3>
          <div className="mt-4 space-y-3">
            {business.missedCalls.length === 0 ? (
              <EmptyState message="No missed calls recorded for this client yet." />
            ) : (
              business.missedCalls.map((call) => (
                <div
                  key={call.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-lr-strong">
                      {call.callerName}
                    </p>
                    <Badge value={call.status} />
                  </div>
                  <p className="mt-1 text-sm text-lr-muted">
                    {call.callerPhone} - {formatDateTime(call.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-lr-muted">
                    {previewText(
                      call.missedCallAssistantIntake?.nextAction ||
                        call.reason ||
                        "No intake details yet."
                    )}
                  </p>
                  {call.routingAttempts.length > 0 && (
                    <div className="mt-3 rounded-xl bg-lr-surface-muted px-3 py-2 text-xs font-semibold text-lr-muted">
                      Tried{" "}
                      {call.routingAttempts
                        .map(
                          (attempt) =>
                            `${attempt.routeLabel || `Phone ${
                              attempt.routeOrder + 1
                            }`}: ${attempt.routedToPhoneNumber} (${attempt.status})`
                        )
                        .join(" -> ")}
                    </div>
                  )}
                  {call.convertedLead && (
                    <Link
                      href={`/leads/${call.convertedLead.id}`}
                      className="mt-3 inline-flex text-sm font-bold text-lr-strong hover:text-emerald-700"
                    >
                      Open converted lead
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewsAndGrowth({
  data,
}: {
  data: AdminClientDetailData
}) {
  const { business } = data

  return (
    <section
      id="growth"
      className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
    >
      <SectionHeader
        eyebrow="Growth"
        title="Reviews, SEO, marketing, and audit work"
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div id="reviews" className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">Reviews</h3>
          {business.reviewRequests.length === 0 ? (
            <EmptyState message="No review requests have been tracked yet." />
          ) : (
            business.reviewRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {request.customerName}
                  </p>
                  <Badge value={request.status} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {request.lead?.customerName || "No linked lead"} -{" "}
                  {formatDate(request.createdAt)}
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(request.message || "No message saved.")}
                </p>
              </div>
            ))
          )}
        </div>

        <div id="work" className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">
            Internal assignments
          </h3>
          {business.internalAssignments.length === 0 ? (
            <EmptyState message="No internal assignments for this client." />
          ) : (
            business.internalAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {assignment.title}
                  </p>
                  <Badge value={assignment.status} />
                  <PriorityBadge value={assignment.priority} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {labelFromValue(assignment.category)} -{" "}
                  {assignment.worker?.name ||
                    assignment.worker?.email ||
                    "Unassigned"}
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(
                    assignment.description || "No description saved."
                  )}
                </p>
              </div>
            ))
          )}
        </div>

        <div id="security" className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">Growth tasks</h3>
          {business.growthTasks.length === 0 ? (
            <EmptyState message="No SEO or growth tasks for this client yet." />
          ) : (
            business.growthTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">{task.title}</p>
                  <Badge value={task.status} />
                  <PriorityBadge value={task.priority} />
                </div>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(task.description || labelFromValue(task.category))}
                </p>
              </div>
            ))
          )}
        </div>

        <div id="marketing" className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">
            Marketing calendar
          </h3>
          {business.marketingCalendarItems.length === 0 ? (
            <EmptyState message="No marketing calendar items yet." />
          ) : (
            business.marketingCalendarItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">{item.title}</p>
                  <Badge value={item.status} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {item.channel || "No channel"} - scheduled{" "}
                  {formatDate(item.scheduledFor)}
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(
                    item.campaignGoal || item.contentTheme || item.notes
                  )}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 xl:col-span-2">
          <h3 className="text-lg font-black text-lr-strong">
            Audits and opportunities
          </h3>
          {[...business.websiteAuditFindings, ...business.serviceOpportunities]
            .length === 0 ? (
            <EmptyState message="No open audit findings or service opportunities." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ...business.websiteAuditFindings,
                ...business.serviceOpportunities,
              ].map((item) => (
                <div
                  key={`${"severity" in item ? "finding" : "opportunity"}-${
                    item.id
                  }`}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-lr-strong">{item.title}</p>
                    <PriorityBadge
                      value={"severity" in item ? item.severity : item.priority}
                    />
                  </div>
                  <p className="mt-2 text-sm text-lr-muted">
                    {previewText(
                      "recommendation" in item
                        ? item.recommendation || item.description
                        : item.description
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function OperationsLog({
  data,
}: {
  data: AdminClientDetailData
}) {
  const { business } = data

  return (
    <section
      id="jobs"
      className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
    >
      <SectionHeader
        eyebrow="Operations"
        title="Automation, AI, SMS, email, and internal notes"
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">Jobs</h3>
          {business.opsJobRuns.length === 0 ? (
            <EmptyState message="No jobs have been recorded for this client." />
          ) : (
            business.opsJobRuns.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">{job.name}</p>
                  <Badge value={job.status} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {labelFromValue(job.kind)} - attempts {job.attemptsMade}/
                  {job.maxAttempts}
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(job.error || job.details || "No job details.")}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">AI usage</h3>
          {business.aiUsageLogs.length === 0 ? (
            <EmptyState message="No AI usage has been logged for this client." />
          ) : (
            business.aiUsageLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {labelFromValue(log.feature)}
                  </p>
                  <Badge value={log.status} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {log.provider} {log.model} -{" "}
                  {formatMoney(log.estimatedCostCents)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">SMS messages</h3>
          {business.smsMessages.length === 0 ? (
            <EmptyState message="No SMS messages have been logged for this client." />
          ) : (
            business.smsMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {labelFromValue(message.direction)}
                  </p>
                  <Badge value={message.status} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {message.fromPhone || "Unknown"} to{" "}
                  {message.toPhone || "Unknown"}
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(message.body)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">Internal notes</h3>
          {business.internalClientNotes.length === 0 ? (
            <EmptyState message="No internal notes for this client yet." />
          ) : (
            business.internalClientNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {labelFromValue(note.category)}
                  </p>
                  <span className="text-xs font-bold text-lr-subtle">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-lr-muted">
                  {previewText(note.body)}
                </p>
                <p className="mt-2 text-xs font-semibold text-lr-subtle">
                  {note.authorEmail || note.worker?.email || "Internal"}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black text-lr-strong">
            Security events
          </h3>
          {business.securityEvents.length === 0 ? (
            <EmptyState message="No security events have been logged for this client." />
          ) : (
            business.securityEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-lr-strong">
                    {labelFromValue(event.type)}
                  </p>
                  <Badge value={event.outcome} />
                </div>
                <p className="mt-1 text-sm text-lr-muted">
                  {event.summary || "Security event recorded."}
                </p>
                <p className="mt-2 text-xs font-semibold text-lr-subtle">
                  {event.actorEmail || data.ownerEmail} -{" "}
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default async function AdminClientPage({
  params,
}: AdminClientPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!isAdminEmail(session.user.email)) {
    notFound()
  }

  const { id } = await params
  const data = await getAdminClientDetail(id)

  if (!data) {
    notFound()
  }

  const { business, metrics } = data
  const setupReadyCount = data.setupChecks.filter((item) => item.ready).length
  const missedCallReplyRate = percent(
    metrics.missedCallRepliedCount,
    metrics.missedCallTotalCount
  )

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />

        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sm font-bold text-lr-muted hover:text-lr-strong"
          >
            Back to admin
          </Link>
        </div>

        <section className="mt-5 overflow-hidden rounded-3xl border border-lr-border bg-lr-primary text-lr-on-primary shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lr-on-primary/80 ring-1 ring-white/15">
                  Client account
                </span>
                <Badge value={business.billingStatus} />
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                {business.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-lr-on-primary/75">
                Owner account: {data.ownerEmail}. Use this page to review setup,
                activity, automation, and internal work for this client.
              </p>
            </div>
            <div className="grid content-end gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-sm font-semibold text-lr-on-primary/75">
                  Setup ready
                </p>
                <p className="mt-2 text-4xl font-black">
                  {setupReadyCount}/{data.setupChecks.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-sm font-semibold text-lr-on-primary/75">
                  Captured revenue
                </p>
                <p className="mt-2 text-4xl font-black">
                  {formatMoney(metrics.capturedRevenueCents)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <nav className="mt-5 overflow-x-auto rounded-2xl border border-lr-border bg-lr-surface p-2 text-sm font-bold shadow-sm shadow-lr-shadow/30">
          <div className="flex min-w-max gap-1">
            {[
              ["Profile", "#profile"],
              ["Setup", "#setup"],
              ["Activity", "#activity"],
              ["Growth", "#growth"],
              ["Marketing", "#marketing"],
              ["Operations", "#jobs"],
              ["Security", "#security"],
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

        {data.nextActions.length > 0 && (
          <section className="mt-6 rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
            <SectionHeader
              eyebrow="Next actions"
              title="What needs attention for this client"
            />
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {data.nextActions.map((action) => (
                <a
                  key={`${action.label}-${action.title}`}
                  href={action.href}
                  className={`rounded-2xl border p-4 ${actionClassName(
                    action.tone
                  )}`}
                >
                  <p className="text-xs font-black uppercase tracking-wide opacity-70">
                    {action.label}
                  </p>
                  <p className="mt-2 text-lg font-black">{action.title}</p>
                  <p className="mt-2 text-xs leading-5 opacity-80">
                    {action.detail}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Leads"
            value={business._count.leads}
            detail={`${metrics.capturedLeadCount} captured, ${metrics.openLeadCount} open`}
          />
          <MetricCard
            label="Missed-call reply rate"
            value={`${missedCallReplyRate}%`}
            detail={`${metrics.missedCallRepliedCount}/${metrics.missedCallTotalCount} replied`}
          />
          <MetricCard
            label="Open lead value"
            value={formatMoney(metrics.openLeadValueCents)}
            detail={`${metrics.closedLeadCount} closed leads worth ${formatMoney(
              metrics.closedLeadValueCents
            )}`}
          />
          <MetricCard
            label="Reviews received"
            value={metrics.reviewReceivedCount}
            detail={`${business._count.reviewRequests} total review requests`}
          />
          <MetricCard
            label="Automation health"
            value={metrics.failedJobCount}
            detail={`${metrics.activeJobCount} active jobs, ${formatMoney(
              metrics.aiEstimatedCostCents
            )} AI spend`}
          />
        </section>

        <div className="mt-6 grid gap-6">
          <ClientProfile data={data} />
          <SetupChecklist data={data} />
          <CoreActivity data={data} />
          <ReviewsAndGrowth data={data} />
          <OperationsLog data={data} />
        </div>

        <p className="mt-8 text-center text-xs font-semibold text-lr-subtle">
          Last refreshed {formatDateTime(data.generatedAt)}.
        </p>
      </div>
    </main>
  )
}
