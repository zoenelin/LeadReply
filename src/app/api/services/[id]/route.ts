import { z } from "zod"
import { dollarsToCents } from "@/lib/domain/lead-options"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Please enter a service name."),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  estimateLow: z.string().optional().default(""),
  estimateHigh: z.string().optional().default(""),
  durationMinutes: z.coerce.number().int().min(5).max(1440),
  bookableOnline: z.boolean(),
  ownerConfirmRequired: z.boolean(),
  active: z.boolean(),
})

async function findBusinessService(id: string, businessId: string) {
  return prisma.serviceOffering.findFirst({
    where: {
      id,
      businessId,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingService = await findBusinessService(id, auth.access.businessId)

  if (!existingService) {
    return Response.json({ error: "Service not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = serviceSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }
    const estimateLowCents = dollarsToCents(result.data.estimateLow)
    const estimateHighCents = dollarsToCents(result.data.estimateHigh)

    if (
      estimateLowCents > 0 &&
      estimateHighCents > 0 &&
      estimateHighCents < estimateLowCents
    ) {
      return Response.json(
        { error: "High estimate must be greater than the low estimate." },
        { status: 400 }
      )
    }

    const service = await prisma.serviceOffering.update({
      where: {
        id,
      },
      data: {
        name: result.data.name,
        description: result.data.description,
        category: result.data.category,
        estimateLowCents,
        estimateHighCents,
        durationMinutes: result.data.durationMinutes,
        bookableOnline: result.data.bookableOnline,
        ownerConfirmRequired: result.data.ownerConfirmRequired,
        active: result.data.active,
      },
    })

    return Response.json({ service })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the service." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(_req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", _req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingService = await findBusinessService(id, auth.access.businessId)

  if (!existingService) {
    return Response.json({ error: "Service not found." }, { status: 404 })
  }

  try {
    await prisma.serviceOffering.delete({
      where: {
        id,
      },
    })

    return Response.json({ message: "Service deleted." })
  } catch {
    return Response.json(
      { error: "Something went wrong deleting the service." },
      { status: 500 }
    )
  }
}
