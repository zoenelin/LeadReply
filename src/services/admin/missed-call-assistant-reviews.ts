import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/data/prisma"
import {
  missedCallAssistantReviewStatuses,
  missedCallAssistantStatuses,
  type MissedCallAssistantReviewStatus,
} from "@/lib/domain/status"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"

type UpdateMissedCallAssistantReviewInput = {
  intakeId: string
  adminEmail: string
  status: MissedCallAssistantReviewStatus
  summary: string
  nextAction: string
  notes?: string
}

function clean(value: string | undefined) {
  return value?.trim() ?? ""
}

function getMissedCallAssistantStatusForReview(status: MissedCallAssistantReviewStatus) {
  return status === missedCallAssistantReviewStatuses.approved
    ? missedCallAssistantStatuses.completed
    : missedCallAssistantStatuses.readyForOwner
}

export async function updateMissedCallAssistantAdminReview({
  intakeId,
  adminEmail,
  status,
  summary,
  nextAction,
  notes,
}: UpdateMissedCallAssistantReviewInput) {
  const reviewedSummary = clean(summary)
  const reviewedNextAction = clean(nextAction)
  const reviewedNotes = clean(notes)

  if (!reviewedSummary || !reviewedNextAction) {
    throw new Error("Summary and next action are required.")
  }

  return prisma.$transaction(async (tx) => {
    const intake = await tx.missedCallAssistantIntake.findUnique({
      where: {
        id: intakeId,
      },
      include: {
        lead: true,
      },
    })

    if (!intake) {
      throw new Error("Missed-call assistant intake not found.")
    }

    const updatedIntake = await tx.missedCallAssistantIntake.update({
      where: {
        id: intake.id,
      },
      data: {
        status: getMissedCallAssistantStatusForReview(status),
        adminReviewStatus: status,
        adminReviewSummary: reviewedSummary,
        adminReviewNextAction: reviewedNextAction,
        adminReviewNotes: reviewedNotes,
        adminReviewedAt: new Date(),
        adminReviewedByEmail: adminEmail,
      },
    })

    if (intake.lead) {
      const updatedLead = await tx.lead.update({
        where: {
          id: intake.lead.id,
        },
        data: {
          followUpNote: reviewedNextAction,
        },
      })

      await syncCustomerJobFromLead(tx, updatedLead, {
        createActivity: true,
        activityType: "AI_INTAKE_REVIEWED",
        activityTitle:
          status === missedCallAssistantReviewStatuses.approved
            ? "missed-call assistant intake approved"
            : "missed-call assistant intake review saved",
        activityBody: [
          reviewedSummary,
          `Next action: ${reviewedNextAction}`,
          reviewedNotes ? `Admin notes: ${reviewedNotes}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        activitySource: "ADMIN_REVIEW",
        authorName: adminEmail,
      })
    }

    return updatedIntake
  })
}

export function serializeMissedCallAssistantReviewError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return "The missed-call assistant review could not be saved."
  }

  return error instanceof Error ? error.message : "Invalid missed-call assistant review."
}
