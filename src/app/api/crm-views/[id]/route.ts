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

const crmViewUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  filters: z
    .object({
      viewFilter: z.enum(customerJobViewFilters).default("ALL"),
      sourceFilter: z.string().trim().max(80).default("ALL"),
      searchTerm: z.string().trim().max(120).default(""),
    })
    .optional(),
  visibleColumns: z
    .array(z.enum(customerJobColumnKeys))
    .min(1, "Choose at least one column.")
    .optional(),
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
    .optional(),
  columnWidths: z.record(z.string(), z.number().min(90).max(520)).optional(),
  sortKey: z.enum(customerJobSortKeys).optional(),
  sortDirection: z.enum(["ASC", "DESC"]).optional(),
})

type CrmViewRouteProps = {
  params: Promise<{
    id: string
  }>
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

export async function PATCH(req: Request, { params }: CrmViewRouteProps) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageCrmViews", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = crmViewUpdateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid view." },
      { status: 400 }
    )
  }

  const updateResult = await prisma.businessCrmView.updateMany({
    where: {
      id,
      businessId: auth.access.businessId,
    },
    data: {
      ...(result.data.name !== undefined ? { name: result.data.name } : {}),
      ...(result.data.filters !== undefined
        ? { filters: toJson(result.data.filters) }
        : {}),
      ...(result.data.visibleColumns !== undefined
        ? { visibleColumns: toJson(result.data.visibleColumns) }
        : {}),
      ...(result.data.customColumns !== undefined
        ? { customColumns: toJson(result.data.customColumns) }
        : {}),
      ...(result.data.columnWidths !== undefined
        ? { columnWidths: toJson(result.data.columnWidths) }
        : {}),
      ...(result.data.sortKey !== undefined ? { sortKey: result.data.sortKey } : {}),
      ...(result.data.sortDirection !== undefined
        ? { sortDirection: result.data.sortDirection }
        : {}),
    },
  })

  if (updateResult.count === 0) {
    return Response.json({ error: "Workspace view not found." }, { status: 404 })
  }

  const view = await prisma.businessCrmView.findUnique({
    where: {
      id,
    },
  })

  return Response.json({
    view: view
      ? toCustomerJobSavedView(view)
      : {
          id,
          name: result.data.name ?? "Saved view",
          filters: result.data.filters ?? {
            viewFilter: "ALL",
            sourceFilter: "ALL",
            searchTerm: "",
          },
          visibleColumns: result.data.visibleColumns ?? defaultCustomerJobColumns,
          customColumns: result.data.customColumns ?? [],
          columnWidths: result.data.columnWidths ?? {},
          sortKey: result.data.sortKey ?? "NEWEST",
          sortDirection: result.data.sortDirection ?? "DESC",
        },
  })
}

export async function DELETE(req: Request, { params }: CrmViewRouteProps) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageCrmViews", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const deleteResult = await prisma.businessCrmView.deleteMany({
    where: {
      id,
      businessId: auth.access.businessId,
    },
  })

  if (deleteResult.count === 0) {
    return Response.json({ error: "Workspace view not found." }, { status: 404 })
  }

  return Response.json({ message: "Workspace view deleted." })
}
