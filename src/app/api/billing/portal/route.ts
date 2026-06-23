import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { createStripePortalSession } from "@/lib/integrations/stripe"
import { logSecurityEvent } from "@/services/security/security-events"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  const business = await prisma.business.findUnique({
    where: {
      id: auth.access.businessId,
    },
    select: {
      id: true,
      stripeCustomerId: true,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  const portal = await createStripePortalSession({
    customerId: business.stripeCustomerId,
  })

  if (!portal.ok) {
    await logSecurityEvent({
      req,
      type: "BILLING_PORTAL_BLOCKED",
      outcome: "BLOCKED",
      actorEmail: auth.session.user.email,
      userId: auth.session.user.id,
      businessId: business.id,
      summary: "Stripe billing portal could not be created.",
      metadata: {
        reason: portal.reason,
      },
    })

    return Response.json({ error: portal.reason }, { status: 400 })
  }

  await logSecurityEvent({
    req,
    type: "BILLING_PORTAL_CREATED",
    actorEmail: auth.session.user.email,
    userId: auth.session.user.id,
    businessId: business.id,
    summary: "Stripe billing portal session was created.",
  })

  return Response.json({ portalUrl: portal.url })
}
