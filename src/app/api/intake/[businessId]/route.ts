import { z } from "zod"
import { getAverageLeadValueCents } from "@/lib/demo-data"
import { prisma } from "@/lib/prisma"

const intakeSchema = z.object({
  customerName: z.string().min(1, "Please enter your name."),
  customerPhone: z.string().min(1, "Please enter your phone number."),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      {
        message: "Please enter a valid email address.",
      }
    ),
  requestDetails: z
    .string()
    .min(1, "Please tell us what you need help with."),
  preferredContactTime: z.string().trim().optional().default(""),
})

function nextMorningFollowUp() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(9, 0, 0, 0)

  return date
}

function buildLeadNotes({
  requestDetails,
  preferredContactTime,
}: {
  requestDetails: string
  preferredContactTime: string
}) {
  return [
    "Lead intake form submission.",
    "",
    `Request: ${requestDetails}`,
    preferredContactTime ? `Best time to reach them: ${preferredContactTime}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params
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
    const result = intakeSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      requestDetails,
      preferredContactTime,
    } = result.data
    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        customerName,
        customerPhone,
        customerEmail,
        source: "WEBSITE",
        status: "NEW",
        estimatedValueCents: getAverageLeadValueCents(business.businessType),
        notes: buildLeadNotes({ requestDetails, preferredContactTime }),
        followUpAt: nextMorningFollowUp(),
        followUpNote: "Reply to this website lead and confirm the next step.",
      },
    })

    return Response.json({ lead }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong sending your request." },
      { status: 500 }
    )
  }
}
