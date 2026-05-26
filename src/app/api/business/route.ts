import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { businessCategoryLabels, planLabels } from "@/lib/business-options"
import { getServerSession } from "next-auth"
import { z } from "zod"

const businessCategoryValues = Object.keys(businessCategoryLabels) as [
  string,
  ...string[],
]
const planValues = Object.keys(planLabels) as [string, ...string[]]

const businessSchema = z.object({
  name: z.string().min(1, "Please enter your business name."),
  phone: z.string().min(1, "Please enter your business phone number."),
  website: z.string().trim().optional().default(""),
  address: z.string().min(1, "Please enter your business address."),
  city: z.string().min(1, "Please enter your city."),
  state: z.string().min(1, "Please select your state."),
  zip: z.string().min(1, "Please enter your ZIP code."),
  businessType: z.enum(businessCategoryValues),
  selectedPlan: z.enum(planValues),
  bookingNotes: z.string().trim().optional().default(""),
  replyTemplate: z
    .string()
    .max(500, "Reply template must be 500 characters or fewer."),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = businessSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const business = await prisma.business.upsert({
      where: {
        userId: session.user.id,
      },
      update: result.data,
      create: {
        ...result.data,
        onboardingComplete: true,
        userId: session.user.id,
      },
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the business." },
      { status: 500 }
    )
  }
}
