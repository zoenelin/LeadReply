import type { ReactNode } from "react"
import { labelFromValue } from "@/services/admin/options"

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export function formatMoney(cents: number) {
  return moneyFormatter.format(cents / 100)
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No date"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "No time"
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function previewText(value: string, length = 120) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value
}

export function readForm(form: HTMLFormElement) {
  const payload: Record<string, string> = {}
  const formData = new FormData(form)

  for (const [key, value] of formData.entries()) {
    payload[key] = String(value)
  }

  return payload
}

function statusClassName(status: string) {
  if (
    status === "ACTIVE" ||
    status === "SUCCEEDED" ||
    status === "POSTED" ||
    status === "DONE" ||
    status === "DELIVERED" ||
    status === "SENT" ||
    status === "RECEIVED"
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  }

  if (
    status === "RUNNING" ||
    status === "QUEUED" ||
    status === "SENDING" ||
    status === "IN_PROGRESS" ||
    status === "SCHEDULED" ||
    status === "TRIALING"
  ) {
    return "bg-sky-50 text-sky-700 ring-sky-200"
  }

  if (
    status === "BLOCKED" ||
    status === "FAILED" ||
    status === "PAST_DUE" ||
    status === "CANCELED"
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200"
  }

  return "bg-amber-50 text-amber-700 ring-amber-200"
}

function priorityClassName(priority: string) {
  if (priority === "HIGH") {
    return "bg-rose-50 text-rose-700 ring-rose-200"
  }

  if (priority === "LOW") {
    return "bg-lr-hover text-lr-muted ring-lr-border"
  }

  return "bg-amber-50 text-amber-700 ring-amber-200"
}

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClassName(
        value
      )}`}
    >
      {labelFromValue(value)}
    </span>
  )
}

export function PriorityBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${priorityClassName(
        value
      )}`}
    >
      {labelFromValue(value)}
    </span>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

export function SelectField({
  name,
  defaultValue,
  options,
}: {
  name: string
  defaultValue?: string
  options: readonly string[]
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm font-medium text-lr-strong outline-none transition focus:border-lr-strong focus:ring-2 focus:ring-lr-border"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labelFromValue(option)}
        </option>
      ))}
    </select>
  )
}

export function InlineSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-36 rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold text-lr-body outline-none transition hover:bg-lr-hover focus:border-lr-strong focus:ring-2 focus:ring-lr-border"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labelFromValue(option)}
        </option>
      ))}
    </select>
  )
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30">
      <p className="text-sm font-semibold text-lr-subtle">{label}</p>
      <p className="mt-2 text-3xl font-black text-lr-strong">{value}</p>
      <p className="mt-2 text-sm text-lr-muted">{detail}</p>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-lr-border-strong bg-lr-surface-muted px-4 py-6 text-sm font-medium text-lr-muted">
      {message}
    </div>
  )
}
