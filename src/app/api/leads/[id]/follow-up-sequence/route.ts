import { getSuggestedFollowUpSteps } from "@/lib/domain/follow-up-sequences"
import { prisma } from "@/lib/data/prisma"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

export async function POST(
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

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      businessId: auth.access.businessId,
    },
    include: {
      business: true,
      followUpSteps: true,
    },
  })

  if (!lead) {
    return Response.json({ error: "Lead not found." }, { status: 404 })
  }

  if (lead.followUpSteps.length > 0) {
    return Response.json(
      { error: "This lead already has a follow-up sequence." },
      { status: 400 }
    )
  }

  try {
    const suggestedSteps = getSuggestedFollowUpSteps({
      businessName: lead.business.name,
      businessType: lead.business.businessType,
      customerName: lead.customerName,
      requestContext: lead.followUpNote || lead.notes,
    })

    const followUpSteps = await prisma.$transaction(async (tx) => {
      const createdSteps = []

      for (const step of suggestedSteps) {
        const createdStep = await tx.followUpStep.create({
          data: {
            businessId: lead.businessId,
            leadId: lead.id,
            title: step.title,
            message: step.message,
            channel: step.channel,
            stepOrder: step.stepOrder,
            dueAt: step.dueAt,
          },
        })
        createdSteps.push(createdStep)
      }

      if (!lead.followUpAt) {
        await tx.lead.update({
          where: {
            id: lead.id,
          },
          data: {
            followUpAt: suggestedSteps[0]?.dueAt ?? null,
            followUpNote: lead.followUpNote || (suggestedSteps[0]?.message ?? ""),
          },
        })
      }

      return createdSteps
    })

    return Response.json({ followUpSteps }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong creating the follow-up sequence." },
      { status: 500 }
    )
  }
}
