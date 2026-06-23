import { appointmentStatuses, leadStatuses } from "@/lib/domain/status"

export const leadSourceOptions = [
  { value: "MISSED_CALL", label: "Missed call" },
  { value: "WEBSITE", label: "Website" },
  { value: "GOOGLE_BUSINESS_PROFILE", label: "Google Business Profile" },
  { value: "ORGANIC_SEARCH", label: "Organic search" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "EMAIL", label: "Email" },
  { value: "PAID_ADS", label: "Paid ads" },
  { value: "REFERRAL", label: "Referral" },
  { value: "MANUAL", label: "Manual" },
]

export const leadStatusOptions = [
  { value: leadStatuses.new, label: "New" },
  { value: leadStatuses.current, label: "Current" },
  { value: leadStatuses.captured, label: "Captured" },
  { value: leadStatuses.closed, label: "Closed" },
]

export const appointmentStatusOptions = [
  { value: appointmentStatuses.notBooked, label: "Not booked" },
  { value: appointmentStatuses.booked, label: "Booked" },
  { value: "SHOWED", label: "Showed" },
  { value: appointmentStatuses.noShow, label: "No-show" },
  { value: "RESCHEDULED", label: "Rescheduled" },
  { value: appointmentStatuses.cancelled, label: "Cancelled" },
]

export const leadSourceLabels = Object.fromEntries(
  leadSourceOptions.map((source) => [source.value, source.label])
)

export const leadStatusLabels = Object.fromEntries(
  [
    ...leadStatusOptions,
    { value: leadStatuses.contacted, label: "Current" },
  ].map((status) => [status.value, status.label])
)

export const appointmentStatusLabels = Object.fromEntries(
  appointmentStatusOptions.map((status) => [status.value, status.label])
)

export const leadSourceValues: string[] = leadSourceOptions.map(
  (source) => source.value
)

export const leadStatusValues: string[] = [
  ...leadStatusOptions.map((status) => status.value),
  leadStatuses.contacted,
]

export const appointmentStatusValues: string[] = appointmentStatusOptions.map(
  (status) => status.value
)

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function formatMoney(cents: number) {
  return currencyFormatter.format(cents / 100)
}

export function dollarsToCents(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0
  }

  const parsedValue =
    typeof value === "number"
      ? value
      : Number(value.toString().replace(/[$,]/g, ""))

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0
  }

  return Math.round(parsedValue * 100)
}

export function centsToDollars(cents: number) {
  return cents === 0 ? "" : String(Math.round(cents / 100))
}

export function statusClassName(status: string) {
  if (status === leadStatuses.captured) {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === leadStatuses.closed) {
    return "bg-lr-hover text-lr-muted"
  }

  if (
    status === leadStatuses.current ||
    status === leadStatuses.contacted
  ) {
    return "bg-sky-50 text-sky-700"
  }

  return "bg-amber-50 text-amber-700"
}

export function normalizeLeadStatus(status: string) {
  return status === leadStatuses.contacted ? leadStatuses.current : status
}

export function appointmentStatusClassName(status: string) {
  if (status === "SHOWED") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === appointmentStatuses.booked || status === "RESCHEDULED") {
    return "bg-sky-50 text-sky-700"
  }

  if (
    status === appointmentStatuses.noShow ||
    status === appointmentStatuses.cancelled
  ) {
    return "bg-rose-50 text-rose-700"
  }

  return "bg-lr-hover text-lr-body"
}
