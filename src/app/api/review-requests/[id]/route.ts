import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { communicationStatuses, leadStatuses } from "@/lib/domain/status"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const reviewRequestStatuses = [
  communicationStatuses.draft,
  communicationStatuses.sent,
  communicationStatuses.received,
] as const

const reviewRequestUpdateSchema = z.object({
  status: z.enum(reviewRequestStatuses),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageReviews", req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const existingRequest = await prisma.reviewRequest.findFirst({
    where: {
      id,
      businessId: auth.access.businessId,
    },
  })

  if (!existingRequest) {
    return Response.json({ error: "Review request not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const result = reviewRequestUpdateSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const now = new Date()
    const { status } = result.data
    const reviewRequest = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.reviewRequest.update({
        where: {
          id,
        },
        data: {
          status,
          sentAt:
            status === communicationStatuses.draft
              ? null
              : existingRequest.sentAt ?? now,
          receivedAt:
            status === communicationStatuses.received
              ? existingRequest.receivedAt ?? now
              : null,
        },
      })

      if (status === communicationStatuses.received && existingRequest.leadId) {
        await tx.lead.update({
          where: {
            id: existingRequest.leadId,
          },
          data: {
            status: leadStatuses.closed,
            closedAt: now,
          },
        })
      }

      return updatedRequest
    })

    return Response.json({ reviewRequest })
  } catch {
    return Response.json(
      { error: "Something went wrong updating the review request." },
      { status: 500 }
    )
  }
}
