import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { dollarsToCents } from "@/lib/domain/lead-options"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const campaignSchema = z.object({
  name: z.string().trim().min(1, "Please enter a campaign name.").max(140),
  channel: z.string().trim().max(80).optional().default(""),
  goal: z.string().trim().max(180).optional().default(""),
  status: z
    .enum(["PLANNED", "ACTIVE", "PAUSED", "COMPLETED"])
    .optional()
    .default("ACTIVE"),
  cost: z.string().optional().default(""),
  notes: z.string().trim().max(1200).optional().default(""),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageMarketing", req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
    select: {
      id: true,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result = campaignSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const campaign = await prisma.marketingCampaign.create({
    data: {
      businessId: business.id,
      name: result.data.name,
      channel: result.data.channel,
      goal: result.data.goal,
      status: result.data.status,
      costCents: dollarsToCents(result.data.cost),
      notes: result.data.notes,
    },
  })

  return Response.json({ campaign }, { status: 201 })
}
