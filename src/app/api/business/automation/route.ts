import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"

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
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
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
        userId: session.user.id,
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
