import { leadStatuses } from "@/lib/domain/status"

export const customerJobViewFilters = [
  "ALL",
  "NEEDS_ATTENTION",
  leadStatuses.new,
  leadStatuses.current,
  "SCHEDULED",
  "COMPLETED",
  "NO_FOLLOW_UP",
  leadStatuses.captured,
  leadStatuses.closed,
] as const

export type CustomerJobViewFilter = (typeof customerJobViewFilters)[number]

export const customerJobSortKeys = [
  "NEWEST",
  "OLDEST",
  "FOLLOW_UP",
  "VALUE",
  "NAME",
] as const

export type CustomerJobSortKey = (typeof customerJobSortKeys)[number]

export const customerJobColumnKeys = [
  "customer",
  "phone",
  "service",
  "status",
  "jobStatus",
  "appointment",
  "nextStep",
  "lastActivity",
  "moneyMade",
  "source",
  "campaign",
  "assigned",
  "open",
] as const

export type CustomerJobColumnKey = (typeof customerJobColumnKeys)[number]

export type CustomerJobWorkbookColumnFormat = "number" | "money" | "percent"

export type CustomerJobWorkbookColumn = {
  id: string
  label: string
  formula: string
  format: CustomerJobWorkbookColumnFormat
  visible: boolean
  width: number
}

export type CustomerJobColumnWidths = Record<string, number>

export const defaultCustomerJobColumns: CustomerJobColumnKey[] = [
  "customer",
  "phone",
  "service",
  "jobStatus",
  "appointment",
  "nextStep",
  "moneyMade",
  "lastActivity",
  "open",
]

export const customerJobColumnLabels: Record<CustomerJobColumnKey, string> = {
  customer: "Customer",
  phone: "Phone",
  service: "Service/Job",
  status: "Lead status",
  jobStatus: "Job status",
  appointment: "Appointment",
  nextStep: "Next step",
  lastActivity: "Last activity",
  moneyMade: "Money made",
  source: "Source",
  campaign: "Campaign",
  assigned: "Assigned",
  open: "Actions",
}

export type CustomerJobViewFilters = {
  viewFilter: CustomerJobViewFilter
  sourceFilter: string
  searchTerm: string
}

export type CustomerJobSavedView = {
  id: string
  name: string
  filters: CustomerJobViewFilters
  visibleColumns: CustomerJobColumnKey[]
  customColumns: CustomerJobWorkbookColumn[]
  columnWidths: CustomerJobColumnWidths
  sortKey: CustomerJobSortKey
  sortDirection: "ASC" | "DESC"
}

export const defaultCustomerJobFilters: CustomerJobViewFilters = {
  viewFilter: "ALL",
  sourceFilter: "ALL",
  searchTerm: "",
}

const defaultColumnWidths: CustomerJobColumnWidths = {
  customer: 220,
  phone: 150,
  service: 180,
  status: 140,
  jobStatus: 160,
  appointment: 180,
  nextStep: 260,
  lastActivity: 160,
  moneyMade: 140,
  source: 180,
  campaign: 180,
  assigned: 140,
  open: 110,
}

export function getDefaultCustomerJobColumnWidth(columnId: string) {
  return defaultColumnWidths[columnId] ?? 160
}

export function normalizeCustomerJobColumns(
  value: unknown
): CustomerJobColumnKey[] {
  if (!Array.isArray(value)) {
    return defaultCustomerJobColumns
  }

  const columns = value.filter((item): item is CustomerJobColumnKey =>
    customerJobColumnKeys.includes(item as CustomerJobColumnKey)
  )

  return columns.length > 0 ? columns : defaultCustomerJobColumns
}

function normalizeWorkbookColumnId(value: unknown, fallbackIndex: number) {
  if (typeof value !== "string") {
    return `formula-${fallbackIndex + 1}`
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)

  return normalized || `formula-${fallbackIndex + 1}`
}

function normalizeWorkbookColumnFormat(
  value: unknown
): CustomerJobWorkbookColumnFormat {
  return value === "money" || value === "percent" || value === "number"
    ? value
    : "number"
}

export function normalizeCustomerJobWorkbookColumns(
  value: unknown
): CustomerJobWorkbookColumn[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => {
      const input =
        item && typeof item === "object"
          ? (item as Partial<CustomerJobWorkbookColumn>)
          : {}
      const label =
        typeof input.label === "string" && input.label.trim()
          ? input.label.trim().slice(0, 40)
          : `Formula ${index + 1}`
      const formula =
        typeof input.formula === "string" && input.formula.trim()
          ? input.formula.trim().slice(0, 160)
          : "moneyMade"
      const width =
        typeof input.width === "number" && Number.isFinite(input.width)
          ? Math.max(110, Math.min(420, Math.round(input.width)))
          : 160

      return {
        id: normalizeWorkbookColumnId(input.id, index),
        label,
        formula,
        format: normalizeWorkbookColumnFormat(input.format),
        visible: input.visible !== false,
        width,
      }
    })
    .slice(0, 12)
}

export function normalizeCustomerJobColumnWidths(
  value: unknown
): CustomerJobColumnWidths {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {}
  const output: CustomerJobColumnWidths = {}

  for (const [key, width] of Object.entries(input)) {
    if (typeof width === "number" && Number.isFinite(width)) {
      output[key] = Math.max(90, Math.min(520, Math.round(width)))
    }
  }

  return output
}

export function normalizeCustomerJobFilters(
  value: unknown
): CustomerJobViewFilters {
  const input =
    value && typeof value === "object"
      ? (value as Partial<Record<keyof CustomerJobViewFilters, unknown>>)
      : {}
  const viewFilter = customerJobViewFilters.includes(
    input.viewFilter as CustomerJobViewFilter
  )
    ? (input.viewFilter as CustomerJobViewFilter)
    : defaultCustomerJobFilters.viewFilter
  const sourceFilter =
    typeof input.sourceFilter === "string" && input.sourceFilter.trim()
      ? input.sourceFilter.trim()
      : defaultCustomerJobFilters.sourceFilter
  const searchTerm =
    typeof input.searchTerm === "string" ? input.searchTerm.slice(0, 120) : ""

  return {
    viewFilter,
    sourceFilter,
    searchTerm,
  }
}
