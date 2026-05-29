import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"
import { createStripePortalSession } from "@/lib/stripe"

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
    return Response.json({ error: portal.reason }, { status: 400 })
  }

  return Response.json({ portalUrl: portal.url })
}
