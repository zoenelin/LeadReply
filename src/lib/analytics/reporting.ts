import {
  leadSourceLabels,
  leadSourceValues,
  leadStatusLabels,
  leadStatusValues,
  normalizeLeadStatus,
} from "@/lib/domain/lead-options"
import { leadStatuses } from "@/lib/domain/status"

type CsvValue = string | number | boolean | Date | null | undefined

export type ReportFilters = {
  source: string | null
  status: string | null
  startDate: Date | null
  endDate: Date | null
}

export type ReportLead = {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  source: string
  sourceDetail?: string
  campaignName?: string
  campaignCostCents?: number
  marketingCampaignId?: string | null
  marketingCampaign?: {
    name: string
    costCents: number
  } | null
  status: string
  estimatedValueCents: number
  capturedValueCents: number
  notes: string
  followUpAt: Date | null
  followUpCompletedAt: Date | null
  createdAt: Date
  closedAt: Date | null
}

function parseFilterDate(value: string | null, endOfDay = false) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = value instanceof Date ? value.toISOString() : String(value)
  const escapedValue = stringValue.replace(/"/g, '""')

  if (/[",\n\r]/.test(escapedValue)) {
    return `"${escapedValue}"`
  }

  return escapedValue
}

export function getReportFilters(searchParams: URLSearchParams): ReportFilters {
  const sourceParam = searchParams.get("source")
  const statusParam = searchParams.get("status")

  return {
    source:
      sourceParam && sourceParam !== "ALL" && leadSourceValues.includes(sourceParam)
        ? sourceParam
        : null,
    status:
      statusParam && statusParam !== "ALL" && leadStatusValues.includes(statusParam)
        ? statusParam
        : null,
    startDate: parseFilterDate(searchParams.get("start")),
    endDate: parseFilterDate(searchParams.get("end"), true),
  }
}

export function moneyCsvValue(cents: number) {
  return (cents / 100).toFixed(2)
}

export function toCsv(rows: CsvValue[][]) {
  return `${rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n")}\n`
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  })
}

export function datedCsvFilename(prefix: string) {
  const date = new Date().toISOString().slice(0, 10)

  return `${prefix}-${date}.csv`
}

export function buildRevenueSummaryRows(leads: ReportLead[]) {
  return leadSourceValues.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source)
    const capturedLeads = sourceLeads.filter(
      (lead) =>
        lead.status === leadStatuses.captured ||
        (lead.status === leadStatuses.closed && lead.capturedValueCents > 0)
    )
    const openLeads = sourceLeads.filter(
      (lead) =>
        lead.status !== leadStatuses.captured &&
        lead.status !== leadStatuses.closed
    )
    const closedLeads = sourceLeads.filter(
      (lead) => lead.status === leadStatuses.closed
    )
    const revenueCents = sourceLeads.reduce(
      (total, lead) => total + lead.capturedValueCents,
      0
    )
    const linkedCampaignCosts = new Map<string, number>()
    let legacyCampaignCostCents = 0

    sourceLeads.forEach((lead) => {
      if (lead.marketingCampaignId && lead.marketingCampaign) {
        linkedCampaignCosts.set(
          lead.marketingCampaignId,
          lead.marketingCampaign.costCents
        )
        return
      }

      legacyCampaignCostCents += lead.campaignCostCents ?? 0
    })

    const campaignCostCents =
      [...linkedCampaignCosts.values()].reduce((total, cost) => total + cost, 0) +
      legacyCampaignCostCents
    const openLeadValueCents = openLeads.reduce(
      (total, lead) => total + lead.estimatedValueCents,
      0
    )
    const closedLeadValueCents = closedLeads.reduce(
      (total, lead) =>
        total + (lead.capturedValueCents || lead.estimatedValueCents),
      0
    )
    const conversionRate =
      sourceLeads.length === 0
        ? 0
        : Math.round((capturedLeads.length / sourceLeads.length) * 100)

    return {
      source,
      label: leadSourceLabels[source] ?? source,
      leadCount: sourceLeads.length,
      capturedCount: capturedLeads.length,
      conversionRate,
      revenueCents,
      campaignCostCents,
      roiCents: revenueCents - campaignCostCents,
      openLeadValueCents,
      closedLeadValueCents,
    }
  })
}

export function leadSourceLabel(source: string) {
  return leadSourceLabels[source] ?? source
}

export function leadStatusLabel(status: string) {
  return leadStatusLabels[normalizeLeadStatus(status)] ?? status
}
