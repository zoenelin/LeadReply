import { z } from "zod"
import { planLabels } from "@/lib/domain/business-options"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { logSecurityEvent } from "@/services/security/security-events"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"

const planValues = Object.keys(planLabels) as [string, ...string[]]

const billingSchema = z.object({
  selectedPlan: z.enum(planValues),
})

export async function PUT(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const body = await req.json()
    const result = billingSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid plan." },
        { status: 400 }
      )
    }

    const currentBusiness = await prisma.business.findUnique({
      where: {
        id: auth.access.businessId,
      },
      select: {
        id: true,
        selectedPlan: true,
        billingStatus: true,
      },
    })

    if (!currentBusiness) {
      return Response.json({ error: "Business not found." }, { status: 404 })
    }

    const business = await prisma.business.update({
      where: {
        id: currentBusiness.id,
      },
      data: {
        selectedPlan: result.data.selectedPlan,
        billingStatus: "PLAN_SELECTED",
      },
    })

    await logSecurityEvent({
      req,
      type: "BILLING_PLAN_SELECTED",
      actorEmail: auth.session.user.email,
      userId: auth.session.user.id,
      businessId: business.id,
      summary: "Billing plan selection changed.",
      metadata: {
        previousPlan: currentBusiness.selectedPlan,
        selectedPlan: result.data.selectedPlan,
        previousBillingStatus: currentBusiness.billingStatus,
        billingStatus: "PLAN_SELECTED",
      },
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong updating billing." },
      { status: 500 }
    )
  }
}
