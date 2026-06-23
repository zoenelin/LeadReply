import Link from "next/link"
import type { Metadata } from "next"
import type { CSSProperties, ReactNode } from "react"

export const metadata: Metadata = {
  title: "Home Services CRM Preview | LeadReply",
  description:
    "Internal LeadReply design preview for the home-services CRM direction.",
  robots: {
    index: false,
    follow: false,
  },
}

const metrics = [
  { label: "Money made", value: "$18,420", detail: "+22% this month" },
  { label: "New leads", value: "46", detail: "11 need attention" },
  { label: "Avg response", value: "3m", detail: "Fast enough to win" },
  { label: "Reviews sent", value: "29", detail: "8 new reviews" },
]

const priorityItems = [
  {
    label: "Ready now",
    title: "4 missed-call assistant intakes need owner review",
    detail: "Quote or scheduling requested after missed calls.",
  },
  {
    label: "Today",
    title: "6 current leads need a next step",
    detail: "Follow up, assign, schedule, or close.",
  },
  {
    label: "Growth",
    title: "SEO audit waiting for approval",
    detail: "Admin drafted findings for the owner to review.",
  },
]

const leadRows = [
  {
    customer: "Mia Carter",
    service: "HVAC repair",
    status: "New",
    nextStep: "Review missed-call assistant intake",
    value: "$325",
    owner: "Office",
  },
  {
    customer: "Derek Long",
    service: "Plumbing leak",
    status: "Current",
    nextStep: "Send estimate window",
    value: "$680",
    owner: "Jamie",
  },
  {
    customer: "Sofia Reyes",
    service: "Roof inspection",
    status: "Scheduled",
    nextStep: "Confirm Friday 10 AM",
    value: "$1,200",
    owner: "Taylor",
  },
  {
    customer: "Noah Brooks",
    service: "Pest control",
    status: "Captured",
    nextStep: "Send review request",
    value: "$210",
    owner: "Office",
  },
]

const inboxThreads = [
  {
    caller: "Unknown caller",
    service: "Garage door stuck open",
    status: "AI asking intake questions",
    time: "2 min ago",
  },
  {
    caller: "Jordan P.",
    service: "Emergency electrical issue",
    status: "Ready for owner",
    time: "18 min ago",
  },
  {
    caller: "Avery M.",
    service: "Cleaning quote",
    status: "Waiting on customer",
    time: "1 hr ago",
  },
]

const growthRequests = [
  "Run local SEO audit",
  "Improve Google Business Profile",
  "Draft seasonal campaign",
  "Review social media post",
  "Upload service/menu file",
  "Connect catalog or booking source",
]

const roles = [
  {
    role: "Owner",
    access: "Billing, team, CRM, automation, reports, settings",
  },
  {
    role: "Manager",
    access: "Daily operations, CRM, reviews, marketing requests, reports",
  },
  {
    role: "Office",
    access: "Leads, inbox, appointments, messages, notes, review requests",
  },
  {
    role: "Technician",
    access: "Assigned jobs, appointment details, messages, outcomes",
  },
]

const adminItems = [
  "SEO request triage",
  "Marketing draft approval",
  "Website audit job",
  "Missed-call SMS queue",
  "Client setup task",
  "Integration follow-up",
]

const previewTheme = {
  "--lr-page": "#070a0f",
  "--lr-page-gradient-start": "#0d1119",
  "--lr-surface": "#111722",
  "--lr-surface-muted": "#151c29",
  "--lr-surface-raised": "#192233",
  "--lr-hover": "#202b3b",
  "--lr-border": "#2b3545",
  "--lr-border-strong": "#3d4b5f",
  "--lr-strong": "#f7fbff",
  "--lr-body": "#d7e0ed",
  "--lr-muted": "#b9c5d6",
  "--lr-subtle": "#8d9bb0",
  "--lr-primary": "#2f7cf6",
  "--lr-primary-hover": "#55a1ff",
  "--lr-on-primary": "#ffffff",
  "--lr-accent": "#3ee6b5",
  "--lr-field": "#0b111b",
  "--lr-field-border": "#3a4658",
  "--lr-shadow": "#000000",
} as CSSProperties

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-lr-accent">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black text-lr-strong sm:text-3xl">
          {title}
        </h2>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-lr-muted">
        {description}
      </p>
    </div>
  )
}

function MiniChart() {
  const bars = [32, 46, 42, 58, 65, 74, 88, 82, 96, 112, 124, 138]

  return (
    <div className="flex h-44 items-end gap-2 rounded-xl border border-lr-border bg-lr-surface-muted p-4">
      {bars.map((bar, index) => (
        <div
          key={bar}
          className="flex flex-1 items-end"
          aria-label={`Month ${index + 1}: ${bar}`}
        >
          <div
            className="w-full rounded-sm bg-lr-primary"
            style={{ height: `${Math.max(18, bar)}px` }}
          />
        </div>
      ))}
    </div>
  )
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-lr-border bg-lr-surface px-2 py-1 text-xs font-bold text-lr-body">
      {children}
    </span>
  )
}

export default function HomeServicesCrmPreviewPage() {
  return (
    <main
      style={previewTheme}
      className="min-h-screen bg-lr-page text-lr-body"
    >
      <div className="mx-auto flex max-w-[1800px] flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 -mx-4 border-b border-lr-border bg-lr-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 text-lr-strong"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-lr-primary text-sm font-black text-lr-on-primary">
                LR
              </span>
              <span className="text-lg font-black">LeadReply</span>
            </Link>
            <nav
              aria-label="Preview sections"
              className="hidden items-center gap-2 text-sm font-semibold text-lr-muted lg:flex"
            >
              {["Snapshot", "CRM", "Inbox", "Growth", "Team", "Admin"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="rounded-lg px-3 py-2 hover:bg-lr-hover hover:text-lr-strong"
                  >
                    {item}
                  </a>
                )
              )}
            </nav>
            <Link
              href="/leads"
              className="rounded-lg border border-lr-border bg-lr-surface-muted px-3 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover hover:text-lr-strong"
            >
              Back to app
            </Link>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-lr-accent">
              Batch 2 design preview
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-lr-strong sm:text-5xl">
              A sharper home-services CRM built around AI lead capture.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-lr-muted">
              This is the review layer before we rebuild the live screens. The
              goal is simple navigation, spreadsheet-style CRM work, automatic
              missed-call intake, and SEO/marketing requests that flow to
              LeadReply admin instead of overwhelming the business owner.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-lr-border bg-lr-surface p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-black text-lr-strong">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-lr-muted">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="snapshot" className="scroll-mt-24">
          <SectionHeader
            eyebrow="Snapshot"
            title="One daily command center"
            description="The owner sees money made, the most important work, and high-signal metrics without duplicate alerts or extra widgets."
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-xl border border-lr-border bg-lr-surface p-5">
              <p className="text-sm font-bold text-lr-muted">
                Welcome back, Zoe
              </p>
              <h3 className="mt-2 text-2xl font-black text-lr-strong">
                Working with Nelson Home Services
              </h3>
              <div className="mt-5 grid gap-3">
                {priorityItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-lr-border bg-lr-surface-muted p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-wide text-lr-accent">
                      {item.label}
                    </p>
                    <p className="mt-2 font-bold text-lr-strong">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-lr-muted">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-lr-border bg-lr-surface p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                    Money made
                  </p>
                  <p className="mt-1 text-4xl font-black text-lr-strong">
                    $18,420
                  </p>
                </div>
                <StatusPill>Bar view</StatusPill>
              </div>
              <div className="mt-5">
                <MiniChart />
              </div>
            </div>
          </div>
        </section>

        <section id="crm" className="scroll-mt-24">
          <SectionHeader
            eyebrow="Customers/Jobs"
            title="Spreadsheet-simple CRM work"
            description="Default views stay simple, but the future model supports custom columns, saved filters, and role-based views without turning the database into a messy spreadsheet."
          />
          <div className="mt-5 rounded-xl border border-lr-border bg-lr-surface">
            <div className="flex flex-col gap-3 border-b border-lr-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {["New", "Current", "Scheduled", "Captured", "Closed"].map(
                  (view) => (
                    <button
                      key={view}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                        view === "Current"
                          ? "border-lr-primary bg-lr-primary text-lr-on-primary"
                          : "border-lr-border bg-lr-surface-muted text-lr-body"
                      }`}
                    >
                      {view}
                    </button>
                  )
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-lr-border bg-lr-surface-muted px-3 py-2 text-sm font-bold text-lr-body"
                >
                  Columns
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-lr-border bg-lr-surface-muted px-3 py-2 text-sm font-bold text-lr-body"
                >
                  Import CSV
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-lr-primary px-3 py-2 text-sm font-bold text-lr-on-primary"
                >
                  Manual lead
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-lr-border text-xs uppercase tracking-wide text-lr-subtle">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Next step</th>
                    <th className="px-4 py-3">Money made</th>
                    <th className="px-4 py-3">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {leadRows.map((lead) => (
                    <tr
                      key={lead.customer}
                      className="border-b border-lr-border last:border-b-0 hover:bg-lr-hover"
                    >
                      <td className="px-4 py-4 font-bold text-lr-strong">
                        {lead.customer}
                      </td>
                      <td className="px-4 py-4">{lead.service}</td>
                      <td className="px-4 py-4">
                        <StatusPill>{lead.status}</StatusPill>
                      </td>
                      <td className="px-4 py-4">{lead.nextStep}</td>
                      <td className="px-4 py-4 font-bold text-lr-strong">
                        {lead.value}
                      </td>
                      <td className="px-4 py-4">{lead.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-xl border border-lr-border bg-lr-surface p-5">
            <p className="text-xs font-black uppercase tracking-wide text-lr-accent">
              Lead detail
            </p>
            <h3 className="mt-2 text-2xl font-black text-lr-strong">
              One useful record, not a clutter pile
            </h3>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                "Customer and service summary",
                "missed-call assistant intake summary and review rules",
                "Status and next action",
                "Dated notes with author",
                "Messages, calls, job, appointment, review request",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-lr-border bg-lr-surface-muted px-4 py-3 font-semibold text-lr-body"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div id="inbox" className="scroll-mt-24 rounded-xl border border-lr-border bg-lr-surface p-5">
            <p className="text-xs font-black uppercase tracking-wide text-lr-accent">
              Inbox
            </p>
            <h3 className="mt-2 text-2xl font-black text-lr-strong">
              LinkedIn-style split view for missed calls and texts
            </h3>
            <div className="mt-5 grid min-h-[360px] gap-3 lg:grid-cols-[360px_8px_minmax(0,1fr)]">
              <div className="rounded-lg border border-lr-border bg-lr-surface-muted p-3">
                <div className="mb-3 rounded-lg border border-lr-border bg-lr-field px-3 py-2 text-sm text-lr-subtle">
                  Search calls and messages
                </div>
                <div className="grid gap-2">
                  {inboxThreads.map((thread, index) => (
                    <div
                      key={thread.service}
                      className={`rounded-lg border p-3 ${
                        index === 1
                          ? "border-lr-primary bg-lr-hover"
                          : "border-lr-border bg-lr-surface"
                      }`}
                    >
                      <p className="font-bold text-lr-strong">
                        {thread.caller}
                      </p>
                      <p className="mt-1 text-sm text-lr-muted">
                        {thread.service}
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-lr-subtle">
                        {thread.status} - {thread.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden cursor-col-resize rounded-full bg-lr-border lg:block" />
              <div className="rounded-lg border border-lr-border bg-lr-surface-muted p-4">
                <p className="text-sm font-bold text-lr-subtle">
                  Selected conversation
                </p>
                <h4 className="mt-2 text-xl font-black text-lr-strong">
                  Emergency electrical issue
                </h4>
                <div className="mt-4 grid gap-3">
                  <p className="rounded-lg bg-lr-surface p-3 text-sm">
                    LeadReply: Sorry we missed your call. What electrical issue
                    are you seeing right now?
                  </p>
                  <p className="rounded-lg bg-lr-primary p-3 text-sm font-semibold text-lr-on-primary">
                    Customer: Half the house lost power and the breaker keeps
                    tripping.
                  </p>
                  <p className="rounded-lg bg-lr-surface p-3 text-sm">
                    AI summary: urgent electrical safety concern, owner review
                    needed before scheduling or quoting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="growth" className="scroll-mt-24">
          <SectionHeader
            eyebrow="Marketing and SEO"
            title="Requests for help, not owner homework"
            description="The client-side experience asks for approvals and useful source data. LeadReply admin handles the manual work, automation, provider tools, drafts, audits, and reporting."
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-lr-border bg-lr-surface p-5">
              <p className="font-black text-lr-strong">Business owner view</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {growthRequests.map((request) => (
                  <button
                    key={request}
                    type="button"
                    className="rounded-lg border border-lr-border bg-lr-surface-muted px-4 py-3 text-left text-sm font-bold text-lr-body hover:bg-lr-hover"
                  >
                    {request}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-lr-border bg-lr-surface p-5">
              <p className="font-black text-lr-strong">LeadReply admin view</p>
              <div className="mt-4 grid gap-2">
                {adminItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg border border-lr-border bg-lr-surface-muted px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-lr-body">{item}</span>
                    <StatusPill>Queue</StatusPill>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="team" className="scroll-mt-24">
          <SectionHeader
            eyebrow="Team permissions"
            title="Owner-controlled expiring invites"
            description="The owner invites workers by role. Codes and links expire, billing stays owner-only, and each staff member sees only what their job needs."
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)]">
            <div className="rounded-xl border border-lr-border bg-lr-surface p-5">
              <p className="font-black text-lr-strong">Invite flow</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Choose role and optional permissions",
                  "Generate secure one-time invite",
                  "Send by email or text",
                  "Expire automatically if unused",
                  "Owner can revoke anytime",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-lg bg-lr-surface-muted p-3"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-lr-primary text-xs font-black text-lr-on-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-lr-body">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-lr-border bg-lr-surface">
              <div className="grid border-b border-lr-border px-4 py-3 text-xs font-black uppercase tracking-wide text-lr-subtle sm:grid-cols-[180px_1fr]">
                <p>Role</p>
                <p>Default access</p>
              </div>
              {roles.map((role) => (
                <div
                  key={role.role}
                  className="grid gap-1 border-b border-lr-border px-4 py-4 last:border-b-0 sm:grid-cols-[180px_1fr]"
                >
                  <p className="font-black text-lr-strong">{role.role}</p>
                  <p className="text-sm text-lr-muted">{role.access}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="admin" className="scroll-mt-24 rounded-xl border border-lr-border bg-lr-surface p-5">
          <SectionHeader
            eyebrow="Admin operations"
            title="Where manual service and automation meet"
            description="Admin becomes the internal workbench for fulfillment. This is where LeadReply staff can do marketing, SEO, setup, audits, queue monitoring, and client support."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["Client setup", "Growth fulfillment", "Automation health"].map(
              (column) => (
                <div
                  key={column}
                  className="rounded-lg border border-lr-border bg-lr-surface-muted p-4"
                >
                  <p className="font-black text-lr-strong">{column}</p>
                  <div className="mt-4 grid gap-2">
                    {adminItems.slice(0, 3).map((item) => (
                      <div
                        key={`${column}-${item}`}
                        className="rounded-md bg-lr-surface px-3 py-2 text-sm font-semibold text-lr-body"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
