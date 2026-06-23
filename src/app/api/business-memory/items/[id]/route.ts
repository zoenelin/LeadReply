import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { businessMemoryCategories } from "@/services/business-memory/memory"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const categoryValues = businessMemoryCategories.map((category) => category.value) as [
  string,
  ...string[],
]

const itemSchema = z.object({
  category: z.enum(categoryValues).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().min(1).max(1200).optional(),
  status: z.enum(["NEEDS_REVIEW", "APPROVED", "REJECTED"]).optional(),
})

type BusinessMemoryItemRouteProps = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(req: Request, { params }: BusinessMemoryItemRouteProps) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAutomation", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const { id } = await params
    const body = await req.json()
    const result = itemSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const updateResult = await prisma.businessMemoryItem.updateMany({
      where: {
        id,
        businessId: auth.access.businessId,
      },
      data: result.data,
    })

    if (updateResult.count === 0) {
      return Response.json({ error: "Memory item not found." }, { status: 404 })
    }

    const item = await prisma.businessMemoryItem.findUnique({
      where: {
        id,
      },
    })

    return Response.json({ item })
  } catch {
    return Response.json(
      { error: "Something went wrong updating business memory." },
      { status: 500 }
    )
  }
}
