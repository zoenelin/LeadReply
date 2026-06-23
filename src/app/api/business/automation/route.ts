import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const automationSchema = z.object({
  phoneAutomationEnabled: z.boolean(),
  bookingAutomationEnabled: z.boolean(),
  autoSchedulingEnabled: z.boolean(),
  quoteEstimateEnabled: z.boolean(),
  quoteRules: z.string().trim().optional().default(""),
  quoteDisclaimer: z
    .string()
    .trim()
    .optional()
    .default("Prices are estimates only. Final pricing is confirmed by the business."),
  callbackTimeframe: z
    .string()
    .trim()
    .min(1, "Please enter a callback expectation."),
  reviewAutomationEnabled: z.boolean(),
  preferredContactMethod: z.enum(["TEXT", "CALL", "EMAIL"]),
  bookingNotes: z.string().trim().optional().default(""),
  seoSetupNotes: z.string().trim().optional().default(""),
  marketingSetupNotes: z.string().trim().optional().default(""),
  googleReviewUrl: z.string().trim().optional().default(""),
  googleBusinessProfileUrl: z.string().trim().optional().default(""),
  launchNotes: z.string().trim().optional().default(""),
})

export async function PUT(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAutomation", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const body = await req.json()
    const result = automationSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const business = await prisma.business.update({
      where: {
        id: auth.access.businessId,
      },
      data: result.data,
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong updating automation settings." },
      { status: 500 }
    )
  }
}
