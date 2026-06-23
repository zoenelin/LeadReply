import { z } from "zod"
import {
  appointmentStatusValues,
  dollarsToCents,
  leadSourceValues,
  leadStatusValues,
  normalizeLeadStatus,
} from "@/lib/domain/lead-options"
import { appointmentStatuses, leadStatuses } from "@/lib/domain/status"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const leadUpdateSchema = z.object({
  customerName: z.string().min(1, "Please enter the lead name."),
  customerPhone: z.string().min(1, "Please enter a phone number."),
  customerEmail: z.string().trim().optional().default(""),
  source: z.string().refine((value) => leadSourceValues.includes(value), {
    message: "Please choose a lead source.",
  }),
  sourceDetail: z.string().trim().max(300).optional().default(""),
  marketingCampaignId: z.string().trim().optional().default(""),
  status: z.string().refine((value) => leadStatusValues.includes(value), {
    message: "Please choose a lead status.",
  }),
  estimatedValue: z.string().optional().default(""),
  capturedValue: z.string().optional().default(""),
  notes: z.string().trim().optional().default(""),
  followUpAt: z.string().optional().default(""),
  followUpNote: z.string().trim().optional().default(""),
  followUpCompleted: z.boolean().optional().default(false),
  appointmentStatus: z
    .string()
    .optional()
    .default(appointmentStatuses.notBooked)
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

function getCapturedValueCents(
  status: string,
  estimatedValueCents: number,
  capturedValue: string,
  existingCapturedValueCents = 0
) {
  if (status !== leadStatuses.captured && status !== leadStatuses.closed) {
    return 0
  }

  const capturedValueCents = dollarsToCents(capturedValue)

  if (status === leadStatuses.closed) {
    return capturedValueCents > 0
      ? capturedValueCents
      : existingCapturedValueCents
  }

  return capturedValueCents > 0 ? capturedValueCents : estimatedValueCents
}

async function getValidMarketingCampaignId(
  businessId: string,
  marketingCampaignId: string
) {
  if (!marketingCampaignId) {
    return null
  }

  const campaign = await prisma.marketingCampaign.findFirst({
    where: {
      id: marketingCampaignId,
      businessId,
    },
    select: {
      id: true,
    },
  })

  return campaign?.id ?? undefined
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params

  const existingLead = await prisma.lead.findFirst({
    where: {
      id,
      businessId: auth.access.businessId,
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
      sourceDetail,
      marketingCampaignId,
      status: rawStatus,
      estimatedValue,
      capturedValue,
      notes,
      followUpAt,
      followUpNote,
      followUpCompleted,
      appointmentStatus,
      appointmentAt,
      appointmentNotes,
    } = result.data
    const status = normalizeLeadStatus(rawStatus)
    const shouldClose = status === leadStatuses.closed
    const estimatedValueCents = dollarsToCents(estimatedValue)
    const validMarketingCampaignId = await getValidMarketingCampaignId(
      existingLead.businessId,
      marketingCampaignId
    )

    if (validMarketingCampaignId === undefined) {
      return Response.json(
        { error: "Please choose a valid marketing campaign." },
        { status: 400 }
      )
    }

    const lead = await prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: {
          id,
        },
        data: {
          customerName,
          customerPhone,
          customerEmail,
          source,
          sourceDetail,
          marketingCampaignId: validMarketingCampaignId,
          status,
          estimatedValueCents,
          capturedValueCents: getCapturedValueCents(
            status,
            estimatedValueCents,
            capturedValue,
            existingLead.capturedValueCents
          ),
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

      await syncCustomerJobFromLead(tx, updatedLead)

      return updatedLead
    })

    return Response.json({ lead })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the lead." },
      { status: 500 }
    )
  }
}
