"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type {
  GrowthActionCategory,
  GrowthActionItem,
  GrowthActionPriority,
  NextBestGrowthAction,
} from "@/lib/growth-readiness"

type SerializedGrowthTask = {
  id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  source: string
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

type GrowthWorkbenchProps = {
  seoActions: GrowthActionItem[]
  marketingActions: GrowthActionItem[]
  nextBestAction: NextBestGrowthAction
  growthTasks: SerializedGrowthTask[]
  marketingCalendarItems: SerializedMarketingCalendarItem[]
  seoAccess: boolean
  marketingAccess: boolean
}

const taskCategoryOptions: {
  value: GrowthActionCategory
  label: string
}[] = [
  { value: "SEO", label: "SEO" },
  { value: "MARKETING", label: "Marketing" },
  { value: "GENERAL", label: "General" },
]

const priorityOptions: {
  value: GrowthActionPriority
  label: string
}[] = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
]

const taskStatusOptions = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
]

const calendarStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "NEEDS_APPROVAL", label: "Needs approval" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "POSTED", label: "Posted" },
]

const channelOptions = [
  "Google Business Profile",
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Email",
  "Direct mail",
]

function statusLabel(
  value: string,
  options: {
    value: string
    label: string
  }[]
) {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatDate(value: string) {
  if (!value) {
    return "No date set"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "No date set"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function priorityClassName(priority: string) {
  if (priority === "HIGH") {
    return "bg-rose-50 text-rose-700"
  }

  if (priority === "LOW") {
    return "bg-slate-100 text-slate-700"
  }

  return "bg-amber-50 text-amber-700"
}

function statusClassName(status: string) {
  if (status === "DONE" || status === "POSTED") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "IN_PROGRESS" || status === "SCHEDULED") {
    return "bg-sky-50 text-sky-700"
  }

  if (status === "NEEDS_APPROVAL") {
    return "bg-amber-50 text-amber-700"
  }

  return "bg-slate-100 text-slate-700"
}

export function GrowthWorkbench({
  seoActions,
  marketingActions,
  nextBestAction,
  growthTasks,
  marketingCalendarItems,
  seoAccess,
  marketingAccess,
}: GrowthWorkbenchProps) {
  const router = useRouter()
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskCategory, setTaskCategory] = useState<GrowthActionCategory>("SEO")
  const [taskPriority, setTaskPriority] =
    useState<GrowthActionPriority>("MEDIUM")
  const [taskDueAt, setTaskDueAt] = useState("")
  const [calendarTitle, setCalendarTitle] = useState("")
  const [calendarChannel, setCalendarChannel] = useState("Google Business Profile")
  const [calendarGoal, setCalendarGoal] = useState("")
  const [calendarTheme, setCalendarTheme] = useState("")
  const [calendarOffer, setCalendarOffer] = useState("")
  const [calendarScheduledFor, setCalendarScheduledFor] = useState("")
  const [calendarNotes, setCalendarNotes] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const openTaskCount = growthTasks.filter((task) => task.status !== "DONE").length
  const scheduledCalendarCount = marketingCalendarItems.filter(
    (item) => item.status === "SCHEDULED" || item.status === "POSTED"
  ).length

  async function createTask(payload: {
    title: string
    description: string
    category: GrowthActionCategory
    priority: GrowthActionPriority
    dueAt?: string
    source?: "MANUAL" | "SUGGESTED"
  }) {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/growth-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Growth task added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await createTask({
      title: taskTitle,
      description: taskDescription,
      category: taskCategory,
      priority: taskPriority,
      dueAt: taskDueAt,
      source: "MANUAL",
    })
    setTaskTitle("")
    setTaskDescription("")
    setTaskCategory("SEO")
    setTaskPriority("MEDIUM")
    setTaskDueAt("")
  }

  async function addSuggestedTask(action: GrowthActionItem) {
    await createTask({
      title: action.title,
      description: action.description,
      category: action.category,
      priority: action.priority,
      source: "SUGGESTED",
    })
  }

  async function updateTask(id: string, body: Record<string, string>) {
    setMessage("")

    try {
      const res = await fetch(`/api/growth-tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Growth task updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  async function deleteTask(id: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/growth-tasks/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Growth task removed.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  async function addCalendarItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/marketing-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: calendarTitle,
          channel: calendarChannel,
          campaignGoal: calendarGoal,
          contentTheme: calendarTheme,
          offer: calendarOffer,
          scheduledFor: calendarScheduledFor,
          notes: calendarNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setCalendarTitle("")
      setCalendarChannel("Google Business Profile")
      setCalendarGoal("")
      setCalendarTheme("")
      setCalendarOffer("")
      setCalendarScheduledFor("")
      setCalendarNotes("")
      setMessage("Marketing calendar item added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function updateCalendarItem(id: string, body: Record<string, string>) {
    setMessage("")

    try {
      const res = await fetch(`/api/marketing-calendar/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Marketing calendar updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  async function deleteCalendarItem(id: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/marketing-calendar/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Marketing calendar item removed.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Next best action
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {nextBestAction.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-700">
              {nextBestAction.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityClassName(
                  nextBestAction.priority
                )}`}
              >
                {nextBestAction.priority.toLowerCase()} priority
              </span>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-700">
                {nextBestAction.label}
              </span>
            </div>
          </div>
          <Link
            href={nextBestAction.href}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Open action
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Open growth tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {openTaskCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Suggested actions</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {[...seoActions, ...marketingActions].filter((action) => !action.ready).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Scheduled or posted</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {scheduledCalendarCount}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            SEO action plan
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Turn setup details into launch work
          </h2>
          {!seoAccess ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6">
              <p className="font-bold text-slate-950">SEO opens on Growth</p>
              <p className="mt-2 text-sm text-slate-600">
                Upgrade paths unlock local SEO action planning, growth tasks,
                and website visibility work.
              </p>
              <Link
                href="/settings/billing"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Review plans
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {seoActions.map((action) => (
                <article
                  key={action.key}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {action.title}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${
                            action.ready
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {action.ready ? "Ready" : "Needs work"}
                        </span>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityClassName(
                            action.priority
                          )}`}
                        >
                          {action.priority.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {action.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={action.href}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      {!action.ready && (
                        <button
                          type="button"
                          onClick={() => addSuggestedTask(action)}
                          disabled={loading}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          Add task
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Marketing action plan
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Build the campaign brief
          </h2>
          {!marketingAccess ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6">
              <p className="font-bold text-slate-950">
                Marketing opens on Complete
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Growth handles SEO setup. Complete adds the marketing calendar,
                campaign planning, and social presence workflow.
              </p>
              <Link
                href="/settings/billing"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Review plans
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {marketingActions.map((action) => (
                <article
                  key={action.key}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {action.title}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${
                            action.ready
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {action.ready ? "Ready" : "Needs work"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {action.description}
                      </p>
                    </div>
                    {!action.ready && (
                      <button
                        type="button"
                        onClick={() => addSuggestedTask(action)}
                        disabled={loading}
                        className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        Add task
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={addTask}
          className="rounded-2xl border border-slate-200 p-5"
        >
          <h2 className="text-xl font-bold text-slate-950">Add growth task</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Task</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Create service-area landing page"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category
                </label>
                <select
                  value={taskCategory}
                  onChange={(e) =>
                    setTaskCategory(e.target.value as GrowthActionCategory)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
                >
                  {taskCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as GrowthActionPriority)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Due date
                </label>
                <input
                  type="date"
                  value={taskDueAt}
                  onChange={(e) => setTaskDueAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="What needs to happen, who owns it, or what to check."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add task"}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-950">Growth tasks</h2>
          <div className="mt-5 space-y-3">
            {growthTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                <p className="font-semibold text-slate-950">
                  No saved growth tasks yet.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Add tasks manually or create them from the action plan above.
                </p>
              </div>
            ) : (
              growthTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {task.title}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                            task.status
                          )}`}
                        >
                          {statusLabel(task.status, taskStatusOptions)}
                        </span>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityClassName(
                            task.priority
                          )}`}
                        >
                          {task.priority.toLowerCase()}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-2 text-sm text-slate-600">
                          {task.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {task.category} task - {formatDate(task.dueAt)}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] lg:w-[360px]">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask(task.id, { status: e.target.value })
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        {taskStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={task.priority}
                        onChange={(e) =>
                          updateTask(task.id, { priority: e.target.value })
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={addCalendarItem}
          className={`rounded-2xl border p-5 ${
            marketingAccess
              ? "border-slate-200"
              : "border-slate-200 bg-slate-50 opacity-75"
          }`}
        >
          <h2 className="text-xl font-bold text-slate-950">
            Add marketing calendar item
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Plan posts, campaigns, offers, and approval steps before real social
            publishing integrations arrive.
          </p>
          <fieldset disabled={!marketingAccess || loading} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={calendarTitle}
                onChange={(e) => setCalendarTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Spring service special"
                required={marketingAccess}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Channel
                </label>
                <select
                  value={calendarChannel}
                  onChange={(e) => setCalendarChannel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
                >
                  {channelOptions.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Planned date
                </label>
                <input
                  type="date"
                  value={calendarScheduledFor}
                  onChange={(e) => setCalendarScheduledFor(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Goal
                </label>
                <input
                  type="text"
                  value={calendarGoal}
                  onChange={(e) => setCalendarGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="More booked appointments"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Content theme
                </label>
                <input
                  type="text"
                  value={calendarTheme}
                  onChange={(e) => setCalendarTheme(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="Customer story, tip, offer, reminder"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Offer</label>
              <input
                type="text"
                value={calendarOffer}
                onChange={(e) => setCalendarOffer(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Free estimate, limited-time package, seasonal promo"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={calendarNotes}
                onChange={(e) => setCalendarNotes(e.target.value)}
                className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Creative direction, image needs, approval notes, or draft copy."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add calendar item"}
            </button>
          </fieldset>
        </form>

        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-950">
            Marketing calendar
          </h2>
          <div className="mt-5 space-y-3">
            {marketingCalendarItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                <p className="font-semibold text-slate-950">
                  No marketing items planned yet.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Add campaigns, posts, and offers when the business is on the
                  Complete plan.
                </p>
              </div>
            ) : (
              marketingCalendarItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {item.title}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status, calendarStatusOptions)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.channel || "Channel not set"} -{" "}
                        {formatDate(item.scheduledFor)}
                      </p>
                      {(item.campaignGoal || item.contentTheme || item.offer) && (
                        <p className="mt-2 text-sm text-slate-600">
                          {[item.campaignGoal, item.contentTheme, item.offer]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      )}
                      {item.notes && (
                        <p className="mt-2 text-sm text-slate-500">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:w-[280px]">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateCalendarItem(item.id, {
                            status: e.target.value,
                          })
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        {calendarStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteCalendarItem(item.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </section>
  )
}
