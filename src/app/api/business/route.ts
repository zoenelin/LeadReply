import { prisma } from "@/lib/data/prisma"
import { businessCategoryLabels, planLabels } from "@/lib/domain/business-options"
import {
  hasBusinessCapability,
  requireApiBusinessAccess,
} from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { z } from "zod"

const businessCategoryValues = Object.keys(businessCategoryLabels) as [
  string,
  ...string[],
]
const planValues = Object.keys(planLabels) as [string, ...string[]]

const businessSchema = z.object({
  name: z.string().min(1, "Please enter your business name."),
  phone: z.string().min(1, "Please enter your business phone number."),
  contactName: z.string().trim().max(120).optional().default(""),
  contactPhonePrimary: z.string().trim().max(40).optional().default(""),
  contactPhoneSecondary: z.string().trim().max(40).optional().default(""),
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
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageBusinessProfile", req)

  if ("response" in auth) {
    return auth.response
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

    const existingBusiness = await prisma.business.findUnique({
      where: {
        id: auth.access.businessId,
      },
      select: {
        selectedPlan: true,
      },
    })
    const canManageBilling = hasBusinessCapability(auth.access, "manageBilling")
    const business = await prisma.business.update({
      where: {
        id: auth.access.businessId,
      },
      data: {
        ...result.data,
        selectedPlan: canManageBilling
          ? result.data.selectedPlan
          : existingBusiness?.selectedPlan,
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
