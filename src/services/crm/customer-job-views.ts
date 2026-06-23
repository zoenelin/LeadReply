import type { BusinessCrmView } from "@prisma/client"
import {
  customerJobSortKeys,
  defaultCustomerJobColumns,
  defaultCustomerJobFilters,
  normalizeCustomerJobColumnWidths,
  normalizeCustomerJobColumns,
  normalizeCustomerJobFilters,
  normalizeCustomerJobWorkbookColumns,
  type CustomerJobSavedView,
  type CustomerJobSortKey,
} from "@/lib/domain/customer-job-views"

export function normalizeCustomerJobSortKey(
  value: unknown
): CustomerJobSortKey {
  return customerJobSortKeys.includes(value as CustomerJobSortKey)
    ? (value as CustomerJobSortKey)
    : "NEWEST"
}

export function toCustomerJobSavedView(
  view: Pick<
    BusinessCrmView,
    | "id"
    | "name"
    | "filters"
    | "visibleColumns"
    | "customColumns"
    | "columnWidths"
    | "sortKey"
    | "sortDirection"
  >
): CustomerJobSavedView {
  return {
    id: view.id,
    name: view.name,
    filters: normalizeCustomerJobFilters(
      view.filters ?? defaultCustomerJobFilters
    ),
    visibleColumns: normalizeCustomerJobColumns(
      view.visibleColumns ?? defaultCustomerJobColumns
    ),
    customColumns: normalizeCustomerJobWorkbookColumns(view.customColumns),
    columnWidths: normalizeCustomerJobColumnWidths(view.columnWidths),
    sortKey: normalizeCustomerJobSortKey(view.sortKey),
    sortDirection: view.sortDirection === "ASC" ? "ASC" : "DESC",
  }
}
