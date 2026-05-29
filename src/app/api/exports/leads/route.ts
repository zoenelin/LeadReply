import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import {
  csvResponse,
  datedCsvFilename,
  getReportFilters,
  leadSourceLabel,
  leadStatusLabel,
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
  })

  const rows = [
    [
      "Lead ID",
      "Customer name",
      "Phone",
      "Email",
      "Source",
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
      leadStatusLabel(lead.status),
      moneyCsvValue(lead.estimatedValueCents),
      moneyCsvValue(lead.wonValueCents),
      lead.followUpAt,
      lead.followUpCompletedAt,
      lead.createdAt,
      lead.closedAt,
      lead.notes,
    ]),
  ]

  return csvResponse(datedCsvFilename("leadreply-leads"), toCsv(rows))
}
