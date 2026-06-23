import { prisma } from "@/lib/data/prisma"
import { businessCategoryLabels, planLabels } from "@/lib/domain/business-options"
import {
  getIndustryAvailabilityPresets,
  getIndustryServicePresets,
} from "@/lib/domain/industry-presets"
import { buildServiceOpportunities } from "@/lib/growth/digital-presence"
import { checkRequestRateLimit, rateLimitResponse } from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { logSecurityEvent } from "@/services/security/security-events"
import { passwordSchema } from "@/lib/security/password-policy"
import bcrypt from "bcrypt"
import { z } from "zod"

const businessCategoryValues = Object.keys(businessCategoryLabels) as [
  string,
  ...string[],
]
const planValues = Object.keys(planLabels) as [string, ...string[]]
const presenceStatusSchema = z
  .enum(["UNKNOWN", "CONNECTED", "MISSING", "NEEDS_WORK", "NOT_NEEDED"])
  .optional()
  .default("UNKNOWN")

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: passwordSchema,
  businessName: z.string().min(1, "Please enter your business name."),
  businessPhone: z.string().min(1, "Please enter your business phone number."),
  website: z.string().trim().optional().default(""),
  websitePresenceStatus: presenceStatusSchema,
  googleBusinessProfileUrl: z.string().trim().optional().default(""),
  googleBusinessProfileStatus: presenceStatusSchema,
  facebookPageUrl: z.string().trim().optional().default(""),
  facebookPageStatus: presenceStatusSchema,
  instagramProfileUrl: z.string().trim().optional().default(""),
  instagramProfileStatus: presenceStatusSchema,
  wantsLeadReplySetupHelp: z.boolean().optional().default(true),
  address: z.string().min(1, "Please enter your business address."),
  city: z.string().min(1, "Please enter your city."),
  state: z.string().min(1, "Please select your state."),
  zip: z.string().min(1, "Please enter your ZIP code."),
  businessType: z.enum(businessCategoryValues),
  selectedPlan: z.enum(planValues),
  bookingNotes: z.string().trim().optional().default(""),
  skippedSetupSections: z.array(z.string()).optional().default([]),
})

function buildSkippedSetupTasks(skippedSections: string[], selectedPlan: string) {
  const skipped = new Set(skippedSections)
  const tasks = []

  if (skipped.has("DIGITAL_PRESENCE")) {
    tasks.push({
      title: "Finish digital presence settings",
      description:
        "Add website, Google Business Profile, Facebook, Instagram, review, and booking links in Settings when ready.",
      category: "PRESENCE",
      status: "TODO",
      priority: selectedPlan === "BASIC" ? "MEDIUM" : "HIGH",
      source: "ONBOARDING_SKIP",
    })
  }

  if (skipped.has("BOOKING_DETAILS")) {
    tasks.push({
      title: "Add booking and estimate notes",
      description:
        "Add appointment, quote, callback, and service notes in Settings so the missed-call assistant has better context.",
      category: "PRESENCE",
      status: "TODO",
      priority: "MEDIUM",
      source: "ONBOARDING_SKIP",
    })
  }

  return tasks
}

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
    await logSecurityEvent({
      req,
      type: "SIGNUP_RATE_LIMITED",
      outcome: "BLOCKED",
      summary: "Signup request blocked by route-level rate limit.",
    })

    return rateLimitResponse(rateLimit.resetAt)
  }

  try {
    const body = await req.json()

    const result = signupSchema.safeParse(body)

    if (!result.success) {
      await logSecurityEvent({
        req,
        type: "SIGNUP_FAILED",
        outcome: "FAILURE",
        summary: "Signup failed validation.",
        metadata: {
          reason: result.error.issues[0]?.message ?? "Invalid input.",
        },
      })

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
      websitePresenceStatus,
      googleBusinessProfileUrl,
      googleBusinessProfileStatus,
      facebookPageUrl,
      facebookPageStatus,
      instagramProfileUrl,
      instagramProfileStatus,
      wantsLeadReplySetupHelp,
      address,
      city,
      state,
      zip,
      businessType,
      selectedPlan,
      bookingNotes,
      skippedSetupSections,
    } = result.data
    const email = result.data.email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      await logSecurityEvent({
        req,
        type: "SIGNUP_FAILED",
        outcome: "FAILURE",
        actorEmail: email,
        userId: existingUser.id,
        summary: "Signup attempted with an email that already exists.",
      })

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
            websitePresenceStatus,
            googleBusinessProfileUrl,
            googleBusinessProfileStatus,
            facebookPageUrl,
            facebookPageStatus,
            instagramProfileUrl,
            instagramProfileStatus,
            wantsLeadReplySetupHelp,
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
            growthTasks: {
              create: buildSkippedSetupTasks(
                skippedSetupSections,
                selectedPlan
              ),
            },
          },
        },
      },
      include: {
        business: true,
      },
    })

    if (user.business) {
      const businessId = user.business.id
      const opportunities = buildServiceOpportunities(user.business)

      if (opportunities.length > 0) {
        await prisma.serviceOpportunity.createMany({
          data: opportunities.map((opportunity) => ({
            ...opportunity,
            businessId,
          })),
        })
      }
    }

    await logSecurityEvent({
      req,
      type: "SIGNUP_COMPLETED",
      actorEmail: user.email,
      userId: user.id,
      businessId: user.business?.id,
      summary: "Owner account and business profile were created.",
      metadata: {
        businessType,
        selectedPlan,
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
