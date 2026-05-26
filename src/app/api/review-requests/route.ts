import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"

const reviewRequestSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  message: z.string().trim().optional().default(""),
  markSent: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = reviewRequestSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: result.data.leadId,
        business: {
          userId: session.user.id,
        },
      },
      include: {
        business: true,
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found." }, { status: 404 })
    }

    const message =
      result.data.message ||
      `Thanks for choosing ${lead.business.name}. Would you mind leaving us a quick review?`

    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        businessId: lead.businessId,
        leadId: lead.id,
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        message,
        status: result.data.markSent ? "SENT" : "DRAFT",
        sentAt: result.data.markSent ? new Date() : null,
      },
    })

    return Response.json({ reviewRequest }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong creating the review request." },
      { status: 500 }
    )
  }
}
