import { prisma } from "@/lib/data/prisma"
import {
  csvResponse,
  datedCsvFilename,
  getReportFilters,
  leadSourceLabel,
  leadStatusLabel,
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
      { error: "Please finish business setup before exporting leads." },
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
    include: {
      marketingCampaign: {
        select: {
          name: true,
          costCents: true,
        },
      },
    },
  })

  const rows = [
    [
      "Lead ID",
      "Customer name",
      "Phone",
      "Email",
      "Source",
      "Source detail",
      "Campaign",
      "Campaign cost USD",
      "Status",
      "Estimated value USD",
      "Captured value USD",
      "Follow-up date",
      "Follow-up completed",
      "Created date",
      "Closed date",
      "Notes",
    ],
    ...leads.map((lead) => [
      lead.id,
      lead.customerName,
      lead.customerPhone,
      lead.customerEmail,
      leadSourceLabel(lead.source),
      lead.sourceDetail,
      lead.marketingCampaign?.name ?? lead.campaignName,
      moneyCsvValue(
        lead.marketingCampaign?.costCents ?? lead.campaignCostCents
      ),
      leadStatusLabel(lead.status),
      moneyCsvValue(lead.estimatedValueCents),
      moneyCsvValue(lead.capturedValueCents),
      lead.followUpAt,
      lead.followUpCompletedAt,
      lead.createdAt,
      lead.closedAt,
      lead.notes,
    ]),
  ]

  return csvResponse(datedCsvFilename("leadreply-leads"), toCsv(rows))
}
