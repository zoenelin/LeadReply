import { prisma } from "@/lib/data/prisma"
import {
  buildRevenueSummaryRows,
  csvResponse,
  datedCsvFilename,
  getReportFilters,
  moneyCsvValue,
  toCsv,
} from "@/lib/analytics/reporting"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

export async function GET(req: Request) {
  const auth = await requireApiBusinessAccess("exportData", req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
  })

  if (!business) {
    return Response.json(
      { error: "Please finish business setup before exporting revenue." },
      { status: 400 }
    )
  }

  const filters = getReportFilters(new URL(req.url).searchParams)
  const createdAt = {
    ...(filters.startDate ? { gte: filters.startDate } : {}),
    ...(filters.endDate ? { lte: filters.endDate } : {}),
  }

  const leads = await prisma.lead.findMany({
    where: {
      businessId: business.id,
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.startDate || filters.endDate ? { createdAt } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  const sourceRows = buildRevenueSummaryRows(leads)
  const totals = sourceRows.reduce(
    (summary, row) => ({
      leadCount: summary.leadCount + row.leadCount,
      capturedCount: summary.capturedCount + row.capturedCount,
      revenueCents: summary.revenueCents + row.revenueCents,
      openLeadValueCents: summary.openLeadValueCents + row.openLeadValueCents,
      closedLeadValueCents:
        summary.closedLeadValueCents + row.closedLeadValueCents,
    }),
    {
      leadCount: 0,
      capturedCount: 0,
      revenueCents: 0,
      openLeadValueCents: 0,
      closedLeadValueCents: 0,
    }
  )
  const totalConversionRate =
    totals.leadCount === 0
      ? 0
      : Math.round((totals.capturedCount / totals.leadCount) * 100)

  const rows = [
    [
      "Source",
      "Leads",
      "Captured leads",
      "Conversion rate",
      "Captured revenue USD",
      "Open lead value USD",
      "Closed value USD",
    ],
    ...sourceRows.map((row) => [
      row.label,
      row.leadCount,
      row.capturedCount,
      `${row.conversionRate}%`,
      moneyCsvValue(row.revenueCents),
      moneyCsvValue(row.openLeadValueCents),
      moneyCsvValue(row.closedLeadValueCents),
    ]),
    [
      "Total",
      totals.leadCount,
      totals.capturedCount,
      `${totalConversionRate}%`,
      moneyCsvValue(totals.revenueCents),
      moneyCsvValue(totals.openLeadValueCents),
      moneyCsvValue(totals.closedLeadValueCents),
    ],
  ]

  return csvResponse(datedCsvFilename("leadreply-revenue"), toCsv(rows))
}
