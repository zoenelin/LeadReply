import { parseCsvRows } from "@/lib/data/csv"
import {
  dollarsToCents,
  leadSourceValues,
  leadStatusValues,
} from "@/lib/domain/lead-options"
import { prisma } from "@/lib/data/prisma"
import { leadStatuses } from "@/lib/domain/status"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function toObjects(rows: string[][]) {
  const [headers = [], ...dataRows] = rows
  const normalizedHeaders = headers.map(normalizeHeader)

  return dataRows.map((row) =>
    Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, row[index] ?? ""])
    )
  )
}

function getCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (value) {
      return value.trim()
    }
  }

  return ""
}

function normalizedStatus(value: string) {
  const status = value.toUpperCase().replace(/\s+/g, "_")

  if (status === "LOST" || status === leadStatuses.contacted) {
    return leadStatuses.current
  }

  if (status === leadStatuses.captured) {
    return leadStatuses.captured
  }

  return leadStatusValues.includes(status) ? status : leadStatuses.new
}

function normalizedSource(value: string) {
  const source = value.toUpperCase().replace(/\s+/g, "_")

  return leadSourceValues.includes(source) ? source : "MANUAL"
}

export function getLeadImportPreview(csv: string) {
  const rows = toObjects(parseCsvRows(csv))
  let validRows = 0

  for (const row of rows) {
    const customerName = getCell(row, ["name", "customername", "customer_name"])
    const customerPhone = getCell(row, [
      "phone",
      "customerphone",
      "customer_phone",
    ])

    if (customerName && customerPhone) {
      validRows += 1
    }
  }

  return {
    totalRows: rows.length,
    validRows: Math.min(validRows, 500),
    skippedRows: Math.max(0, rows.length - Math.min(validRows, 500)),
  }
}

export async function runLeadImportJob({
  businessId,
  csv,
}: {
  businessId: string
  csv: string
}) {
  const rows = toObjects(parseCsvRows(csv))
  const leads = rows.slice(0, 500).flatMap((row) => {
    const customerName = getCell(row, ["name", "customername", "customer_name"])
    const customerPhone = getCell(row, [
      "phone",
      "customerphone",
      "customer_phone",
    ])

    if (!customerName || !customerPhone) {
      return []
    }

    const status = normalizedStatus(getCell(row, ["status"]))
    const source = normalizedSource(getCell(row, ["source"]))

    return {
      businessId,
      customerName,
      customerPhone,
      customerEmail: getCell(row, ["email", "customeremail", "customer_email"]),
      source,
      sourceDetail: getCell(row, [
        "sourcedetail",
        "source_detail",
        "sourcecampaign",
      ]),
      campaignName: getCell(row, ["campaign", "campaignname", "campaign_name"]),
      campaignCostCents: dollarsToCents(
        getCell(row, ["campaigncost", "campaign_cost", "adspend", "ad_spend"])
      ),
      status,
      estimatedValueCents: dollarsToCents(
        getCell(row, ["estimatedvalue", "estimated_value", "value"])
      ),
      capturedValueCents:
        status === leadStatuses.captured || status === leadStatuses.closed
          ? dollarsToCents(
              getCell(row, [
                "capturedvalue",
                "captured_value",
                "revenue",
              ])
            )
          : 0,
      notes: getCell(row, ["notes", "note"]),
      closedAt: status === leadStatuses.closed ? new Date() : null,
    }
  })

  if (leads.length === 0) {
    throw new Error("No valid leads found. Include at least name and phone columns.")
  }

  await prisma.$transaction(async (tx) => {
    for (const leadData of leads) {
      const lead = await tx.lead.create({
        data: leadData,
      })

      await syncCustomerJobFromLead(tx, lead, {
        createActivity: true,
        activityTitle: "Imported customer/job",
        activityBody: lead.notes || lead.sourceDetail,
        activitySource: "CSV_IMPORT",
      })
    }
  })

  return {
    imported: leads.length,
    skipped: Math.max(0, rows.length - leads.length),
  }
}
