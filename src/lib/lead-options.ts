export const leadSourceOptions = [
  { value: "MISSED_CALL", label: "Missed call" },
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "MANUAL", label: "Manual" },
]

export const leadStatusOptions = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
]

export const appointmentStatusOptions = [
  { value: "NOT_BOOKED", label: "Not booked" },
  { value: "BOOKED", label: "Booked" },
  { value: "SHOWED", label: "Showed" },
  { value: "NO_SHOW", label: "No-show" },
  { value: "RESCHEDULED", label: "Rescheduled" },
  { value: "CANCELLED", label: "Cancelled" },
]

export const leadSourceLabels = Object.fromEntries(
  leadSourceOptions.map((source) => [source.value, source.label])
)

export const leadStatusLabels = Object.fromEntries(
  leadStatusOptions.map((status) => [status.value, status.label])
)

export const appointmentStatusLabels = Object.fromEntries(
  appointmentStatusOptions.map((status) => [status.value, status.label])
)

export const leadSourceValues = leadSourceOptions.map((source) => source.value)

export const leadStatusValues = leadStatusOptions.map((status) => status.value)

export const appointmentStatusValues = appointmentStatusOptions.map(
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
  if (status === "WON") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "LOST") {
    return "bg-rose-50 text-rose-700"
  }

  if (status === "CONTACTED") {
    return "bg-sky-50 text-sky-700"
  }

  return "bg-amber-50 text-amber-700"
}

export function appointmentStatusClassName(status: string) {
  if (status === "SHOWED") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "BOOKED" || status === "RESCHEDULED") {
    return "bg-sky-50 text-sky-700"
  }

  if (status === "NO_SHOW" || status === "CANCELLED") {
    return "bg-rose-50 text-rose-700"
  }

  return "bg-slate-100 text-slate-700"
}
