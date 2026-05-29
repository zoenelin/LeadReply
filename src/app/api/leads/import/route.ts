import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { parseCsvRows } from "@/lib/csv"
import { dollarsToCents, leadSourceValues, leadStatusValues } from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const importSchema = z.object({
  csv: z.string().min(1, "Please paste CSV content."),
})

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

  if (status === "CAPTURED") {
    return "WON"
  }

  return leadStatusValues.includes(status) ? status : "NEW"
}

function normalizedSource(value: string) {
  const source = value.toUpperCase().replace(/\s+/g, "_")

  return leadSourceValues.includes(source) ? source : "MANUAL"
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result = importSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const rows = toObjects(parseCsvRows(result.data.csv))
  const leads = rows.slice(0, 500).flatMap((row) => {
    const customerName = getCell(row, ["name", "customername", "customer_name"])
    const customerPhone = getCell(row, ["phone", "customerphone", "customer_phone"])

    if (!customerName || !customerPhone) {
      return []
    }

    const status = normalizedStatus(getCell(row, ["status"]))
    const source = normalizedSource(getCell(row, ["source"]))

    return {
      businessId: business.id,
      customerName,
      customerPhone,
      customerEmail: getCell(row, ["email", "customeremail", "customer_email"]),
      source,
      status,
      estimatedValueCents: dollarsToCents(
        getCell(row, ["estimatedvalue", "estimated_value", "value"])
      ),
      wonValueCents:
        status === "WON"
          ? dollarsToCents(
              getCell(row, [
                "capturedvalue",
                "captured_value",
                "wonvalue",
                "won_value",
                "revenue",
              ])
            )
          : 0,
      notes: getCell(row, ["notes", "note"]),
      closedAt: status === "WON" || status === "LOST" ? new Date() : null,
    }
  })

  if (leads.length === 0) {
    return Response.json(
      { error: "No valid leads found. Include at least name and phone columns." },
      { status: 400 }
    )
  }

  await prisma.lead.createMany({
    data: leads,
  })

  return Response.json({
    imported: leads.length,
    skipped: Math.max(0, rows.length - leads.length),
  })
}
