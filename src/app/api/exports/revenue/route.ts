import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import {
  buildRevenueSummaryRows,
  csvResponse,
  datedCsvFilename,
  getReportFilters,
  moneyCsvValue,
  toCsv,
} from "@/lib/reporting"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
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
      wonCount: summary.wonCount + row.wonCount,
      revenueCents: summary.revenueCents + row.revenueCents,
      pipelineCents: summary.pipelineCents + row.pipelineCents,
      lostOpportunityCents:
        summary.lostOpportunityCents + row.lostOpportunityCents,
    }),
    {
      leadCount: 0,
      wonCount: 0,
      revenueCents: 0,
      pipelineCents: 0,
      lostOpportunityCents: 0,
    }
  )
  const totalConversionRate =
    totals.leadCount === 0
      ? 0
      : Math.round((totals.wonCount / totals.leadCount) * 100)

  const rows = [
    [
      "Source",
      "Leads",
      "Captured leads",
      "Conversion rate",
      "Captured revenue USD",
      "Open pipeline USD",
      "Lost opportunity USD",
    ],
    ...sourceRows.map((row) => [
      row.label,
      row.leadCount,
      row.wonCount,
      `${row.conversionRate}%`,
      moneyCsvValue(row.revenueCents),
      moneyCsvValue(row.pipelineCents),
      moneyCsvValue(row.lostOpportunityCents),
    ]),
    [
      "Total",
      totals.leadCount,
      totals.wonCount,
      `${totalConversionRate}%`,
      moneyCsvValue(totals.revenueCents),
      moneyCsvValue(totals.pipelineCents),
      moneyCsvValue(totals.lostOpportunityCents),
    ],
  ]

  return csvResponse(datedCsvFilename("leadreply-revenue"), toCsv(rows))
}
