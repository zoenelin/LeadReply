import { prisma } from "@/lib/prisma"
import { businessCategoryLabels, planLabels } from "@/lib/business-options"
import {
  getIndustryAvailabilityPresets,
  getIndustryServicePresets,
} from "@/lib/industry-presets"
import { checkRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { rejectCrossSiteRequest } from "@/lib/request-security"
import { passwordSchema } from "@/lib/password-policy"
import bcrypt from "bcrypt"
import { z } from "zod"

const businessCategoryValues = Object.keys(businessCategoryLabels) as [
  string,
  ...string[],
]
const planValues = Object.keys(planLabels) as [string, ...string[]]

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: passwordSchema,
  businessName: z.string().min(1, "Please enter your business name."),
  businessPhone: z.string().min(1, "Please enter your business phone number."),
  website: z.string().trim().optional().default(""),
  address: z.string().min(1, "Please enter your business address."),
  city: z.string().min(1, "Please enter your city."),
  state: z.string().min(1, "Please select your state."),
  zip: z.string().min(1, "Please enter your ZIP code."),
  businessType: z.enum(businessCategoryValues),
  selectedPlan: z.enum(planValues),
  bookingNotes: z.string().trim().optional().default(""),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, "signup", {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  try {
    const body = await req.json()

    const result = signupSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const {
      password,
      businessName,
      businessPhone,
      website,
      address,
      city,
      state,
      zip,
      businessType,
      selectedPlan,
      bookingNotes,
    } = result.data
    const email = result.data.email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return Response.json(
        { error: "An account with that email already exists." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        business: {
          create: {
            name: businessName,
            phone: businessPhone,
            website,
            address,
            city,
            state,
            zip,
            businessType,
            selectedPlan,
            bookingNotes,
            onboardingComplete: true,
            serviceOfferings: {
              create: getIndustryServicePresets(businessType),
            },
            availabilityWindows: {
              create: getIndustryAvailabilityPresets(businessType),
            },
          },
        },
      },
      include: {
        business: true,
      },
    })

    return Response.json(
      {
        message: "Account created successfully.",
        user: {
          id: user.id,
          email: user.email,
          business: user.business,
        },
      },
      { status: 201 }
    )
  } catch {
    return Response.json(
      { error: "Something went wrong creating the account." },
      { status: 500 }
    )
  }
}
