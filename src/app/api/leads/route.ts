import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import {
  appointmentStatusValues,
  dollarsToCents,
  leadSourceValues,
  leadStatusValues,
} from "@/lib/lead-options"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const leadSchema = z.object({
  customerName: z.string().min(1, "Please enter the lead name."),
  customerPhone: z.string().min(1, "Please enter a phone number."),
  customerEmail: z.string().trim().optional().default(""),
  source: z.string().refine((value) => leadSourceValues.includes(value), {
    message: "Please choose a lead source.",
  }),
  status: z.string().refine((value) => leadStatusValues.includes(value), {
    message: "Please choose a lead status.",
  }),
  estimatedValue: z.string().optional().default(""),
  wonValue: z.string().optional().default(""),
  notes: z.string().trim().optional().default(""),
  followUpAt: z.string().optional().default(""),
  followUpNote: z.string().trim().optional().default(""),
  appointmentStatus: z
    .string()
    .optional()
    .default("NOT_BOOKED")
    .refine((value) => appointmentStatusValues.includes(value), {
      message: "Please choose an appointment status.",
    }),
  appointmentAt: z.string().optional().default(""),
  appointmentNotes: z.string().trim().optional().default(""),
})

function parseFollowUpDate(value: string) {
  if (!value) {
    return null
  }

  const parsedDate = new Date(`${value}T09:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

function parseAppointmentDate(value: string) {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

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
  })

  if (!business) {
    return Response.json(
      { error: "Please finish business setup before adding leads." },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const result = leadSchema.safeParse(body)

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
      source,
      status,
      estimatedValue,
      wonValue,
      notes,
      followUpAt,
      followUpNote,
      appointmentStatus,
      appointmentAt,
      appointmentNotes,
    } = result.data
    const closedAt = status === "WON" || status === "LOST" ? new Date() : null

    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        customerName,
        customerPhone,
        customerEmail,
        source,
        status,
        estimatedValueCents: dollarsToCents(estimatedValue),
        wonValueCents: status === "WON" ? dollarsToCents(wonValue) : 0,
        notes,
        followUpAt: parseFollowUpDate(followUpAt),
        followUpNote,
        appointmentStatus,
        appointmentAt: parseAppointmentDate(appointmentAt),
        appointmentNotes,
        closedAt,
      },
    })

    return Response.json({ lead }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong creating the lead." },
      { status: 500 }
    )
  }
}
