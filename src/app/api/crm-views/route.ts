import type { Prisma } from "@prisma/client"
import { z } from "zod"
import {
  customerJobColumnKeys,
  customerJobSortKeys,
  customerJobViewFilters,
  defaultCustomerJobColumns,
} from "@/lib/domain/customer-job-views"
import { prisma } from "@/lib/data/prisma"
import { toCustomerJobSavedView } from "@/services/crm/customer-job-views"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const crmViewSchema = z.object({
  name: z.string().trim().min(1, "Name this view.").max(80),
  filters: z
    .object({
      viewFilter: z.enum(customerJobViewFilters).default("ALL"),
      sourceFilter: z.string().trim().max(80).default("ALL"),
      searchTerm: z.string().trim().max(120).default(""),
    })
    .default({
      viewFilter: "ALL",
      sourceFilter: "ALL",
      searchTerm: "",
    }),
  visibleColumns: z
    .array(z.enum(customerJobColumnKeys))
    .min(1, "Choose at least one column.")
    .default(defaultCustomerJobColumns),
  customColumns: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        label: z.string().trim().min(1).max(40),
        formula: z.string().trim().min(1).max(160),
        format: z.enum(["number", "money", "percent"]).default("number"),
        visible: z.boolean().default(true),
        width: z.number().min(110).max(420).default(160),
      })
    )
    .max(12)
    .default([]),
  columnWidths: z.record(z.string(), z.number().min(90).max(520)).default({}),
  sortKey: z.enum(customerJobSortKeys).default("NEWEST"),
  sortDirection: z.enum(["ASC", "DESC"]).default("DESC"),
})

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageCrmViews", req)

  if ("response" in auth) {
    return auth.response
  }

  const body = await req.json().catch(() => ({}))
  const result = crmViewSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid view." },
      { status: 400 }
    )
  }

  const view = await prisma.businessCrmView.create({
    data: {
      businessId: auth.access.businessId,
      createdByUserId: auth.session.user.id,
      name: result.data.name,
      filters: toJson(result.data.filters),
      visibleColumns: toJson(result.data.visibleColumns),
      customColumns: toJson(result.data.customColumns),
      columnWidths: toJson(result.data.columnWidths),
      sortKey: result.data.sortKey,
      sortDirection: result.data.sortDirection,
    },
  })

  return Response.json({ view: toCustomerJobSavedView(view) }, { status: 201 })
}
