import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const updateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  channel: z.string().trim().max(80).optional(),
  campaignGoal: z.string().trim().max(160).optional(),
  contentTheme: z.string().trim().max(160).optional(),
  offer: z.string().trim().max(220).optional(),
  status: z.enum(["DRAFT", "NEEDS_APPROVAL", "SCHEDULED", "POSTED"]).optional(),
  scheduledFor: z.string().trim().optional(),
  notes: z.string().trim().max(1200).optional(),
})

async function findUserMarketingCalendarItem(id: string, businessId: string) {
  return prisma.marketingCalendarItem.findFirst({
    where: {
      id,
      businessId,
    },
  })
}

function parseOptionalDate(value?: string) {
  if (value === undefined) {
    return undefined
  }

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMarketing", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingItem = await findUserMarketingCalendarItem(
    id,
    auth.access.businessId
  )

  if (!existingItem) {
    return Response.json(
      { error: "Marketing calendar item not found." },
      { status: 404 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const scheduledFor = parseOptionalDate(result.data.scheduledFor)

  if (result.data.scheduledFor !== undefined && scheduledFor === undefined) {
    return Response.json({ error: "Please enter a valid date." }, { status: 400 })
  }

  const item = await prisma.marketingCalendarItem.update({
    where: {
      id,
    },
    data: {
      title: result.data.title,
      channel: result.data.channel,
      campaignGoal: result.data.campaignGoal,
      contentTheme: result.data.contentTheme,
      offer: result.data.offer,
      status: result.data.status,
      notes: result.data.notes,
      ...(result.data.scheduledFor !== undefined ? { scheduledFor } : {}),
    },
  })

  return Response.json({ item })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMarketing", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingItem = await findUserMarketingCalendarItem(
    id,
    auth.access.businessId
  )

  if (!existingItem) {
    return Response.json(
      { error: "Marketing calendar item not found." },
      { status: 404 }
    )
  }

  await prisma.marketingCalendarItem.delete({
    where: {
      id,
    },
  })

  return Response.json({ message: "Marketing calendar item removed." })
}
