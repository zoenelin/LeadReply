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

const leadUpdateSchema = z.object({
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
  followUpCompleted: z.boolean().optional().default(false),
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  const existingLead = await prisma.lead.findFirst({
    where: {
      id,
      business: {
        userId: session.user.id,
      },
    },
  })

  if (!existingLead) {
    return Response.json({ error: "Lead not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = leadUpdateSchema.safeParse(body)

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
      followUpCompleted,
      appointmentStatus,
      appointmentAt,
      appointmentNotes,
    } = result.data
    const shouldClose = status === "WON" || status === "LOST"
    const lead = await prisma.lead.update({
      where: {
        id,
      },
      data: {
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
        followUpCompletedAt: followUpCompleted ? new Date() : null,
        appointmentStatus,
        appointmentAt: parseAppointmentDate(appointmentAt),
        appointmentNotes,
        closedAt: shouldClose ? existingLead.closedAt ?? new Date() : null,
      },
    })

    return Response.json({ lead })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the lead." },
      { status: 500 }
    )
  }
}
