import type { Prisma } from "@prisma/client"
import { appointmentStatuses, leadStatuses } from "@/lib/domain/status"

type LeadCustomerJobInput = {
  id: string
  businessId: string
  customerId?: string | null
  customerName: string
  customerPhone: string
  customerEmail: string
  source: string
  sourceDetail: string
  status: string
  estimatedValueCents: number
  capturedValueCents: number
  notes: string
  followUpAt: Date | null
  followUpNote: string
  followUpCompletedAt: Date | null
  appointmentStatus: string
  appointmentAt: Date | null
  appointmentNotes: string
  createdAt?: Date
  closedAt: Date | null
  serviceOfferingId?: string | null
  marketingCampaignId?: string | null
}

type SyncOptions = {
  createActivity?: boolean
  activityType?: string
  activityTitle?: string
  activityBody?: string
  activitySource?: string
  authorName?: string
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? ""
}

function getJobTitle(lead: LeadCustomerJobInput) {
  return (
    clean(lead.sourceDetail) ||
    clean(lead.notes).split("\n")[0]?.slice(0, 80) ||
    "Service request"
  )
}

export function mapLeadStatusToJobStatus(lead: LeadCustomerJobInput) {
  if (lead.status === leadStatuses.closed) {
    return "CLOSED"
  }

  if (lead.status === leadStatuses.captured) {
    return "COMPLETED"
  }

  if (
    lead.appointmentStatus === appointmentStatuses.booked ||
    Boolean(lead.appointmentAt)
  ) {
    return "SCHEDULED"
  }

  if (
    lead.status === leadStatuses.current ||
    lead.status === leadStatuses.contacted
  ) {
    return "CURRENT"
  }

  return "NEW"
}

async function findMatchingCustomer(
  tx: Prisma.TransactionClient,
  lead: LeadCustomerJobInput
) {
  if (lead.customerId) {
    const linkedCustomer = await tx.customer.findFirst({
      where: {
        id: lead.customerId,
        businessId: lead.businessId,
      },
    })

    if (linkedCustomer) {
      return linkedCustomer
    }
  }

  const phone = clean(lead.customerPhone)
  const email = clean(lead.customerEmail)

  if (!phone && !email) {
    return null
  }

  return tx.customer.findFirst({
    where: {
      businessId: lead.businessId,
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
}

export async function syncCustomerJobFromLead(
  tx: Prisma.TransactionClient,
  lead: LeadCustomerJobInput,
  options: SyncOptions = {}
) {
  const customerName = clean(lead.customerName) || "Unknown customer"
  const customerPhone = clean(lead.customerPhone)
  const customerEmail = clean(lead.customerEmail)
  const existingCustomer = await findMatchingCustomer(tx, lead)
  const customer = existingCustomer
    ? await tx.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
      })
    : await tx.customer.create({
        data: {
          businessId: lead.businessId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
      })

  if (lead.customerId !== customer.id) {
    await tx.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        customerId: customer.id,
      },
    })
  }

  const jobData = {
    businessId: lead.businessId,
    customerId: customer.id,
    title: getJobTitle(lead),
    status: mapLeadStatusToJobStatus(lead),
    source: lead.source,
    sourceDetail: lead.sourceDetail,
    estimatedValueCents: lead.estimatedValueCents,
    capturedValueCents: lead.capturedValueCents,
    notes: lead.notes,
    followUpAt: lead.followUpAt,
    followUpNote: lead.followUpNote,
    followUpCompletedAt: lead.followUpCompletedAt,
    appointmentStatus: lead.appointmentStatus,
    appointmentAt: lead.appointmentAt,
    appointmentNotes: lead.appointmentNotes,
    closedAt: lead.closedAt,
    serviceOfferingId: lead.serviceOfferingId ?? null,
    marketingCampaignId: lead.marketingCampaignId ?? null,
  }
  const existingJob = await tx.job.findUnique({
    where: {
      leadId: lead.id,
    },
  })
  const job = existingJob
    ? await tx.job.update({
        where: {
          id: existingJob.id,
        },
        data: jobData,
      })
    : await tx.job.create({
        data: {
          ...jobData,
          leadId: lead.id,
          createdAt: lead.createdAt,
        },
      })

  if (options.createActivity) {
    await tx.customerActivity.create({
      data: {
        businessId: lead.businessId,
        customerId: customer.id,
        jobId: job.id,
        leadId: lead.id,
        type: options.activityType ?? "LEAD_CAPTURED",
        title: options.activityTitle ?? "Lead captured",
        body: options.activityBody ?? lead.notes ?? "",
        source: options.activitySource ?? "SYSTEM",
        authorName: options.authorName ?? "System",
        occurredAt: new Date(),
      },
    })
  }

  return {
    customer,
    job,
  }
}
