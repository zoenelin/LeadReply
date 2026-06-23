import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { checkRequestRateLimit, rateLimitResponse } from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const widgetLeadSchema = z.object({
  customerName: z.string().trim().min(1, "Please enter your name."),
  customerPhone: z.string().trim().min(1, "Please enter your phone number."),
  customerEmail: z.string().trim().optional().default(""),
  requestDetails: z
    .string()
    .trim()
    .min(1, "Please tell us how we can help.")
    .max(1000, "Please keep the request under 1000 characters."),
  preferredContactTime: z.string().trim().optional().default(""),
  action: z.enum(["CALLBACK", "TEXT"]).optional().default("CALLBACK"),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const { businessId } = await params
  const rateLimit = checkRequestRateLimit(req, `widget:${businessId}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = widgetLeadSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const preferredTime = result.data.preferredContactTime
      ? ` Preferred contact time: ${result.data.preferredContactTime}.`
      : ""
    const contactMethod =
      result.data.action === "TEXT" ? "Customer requested a text." : "Customer requested a callback."

    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        customerName: result.data.customerName,
        customerPhone: result.data.customerPhone,
        customerEmail: result.data.customerEmail,
        source: "WEBSITE",
        status: "NEW",
        notes: `Website widget request. ${contactMethod} ${result.data.requestDetails}${preferredTime}`,
        followUpNote: contactMethod,
        followUpAt: new Date(),
      },
    })

    return Response.json({ lead }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong sending the request." },
      { status: 500 }
    )
  }
}
