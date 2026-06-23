import { formatMoney, leadSourceLabels } from "@/lib/domain/lead-options"

export type PriorityAction = {
  label: string
  title: string
  description: string
  href: string
  buttonLabel: string
}

export function formatSnapshotTime(date: Date | null) {
  if (!date) {
    return "No time set"
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function getPriorityAction({
  missedCallAssistantIntake,
  sequenceStep,
  followUp,
  missedCall,
  newLead,
}: {
  missedCallAssistantIntake:
    | {
        summary: string
        nextAction: string
        leadId: string | null
        missedCall: {
          callerName: string
          callerPhone: string
        }
      }
    | null
  sequenceStep:
    | {
        title: string
        message: string
        dueAt: Date | null
        lead: {
          id: string
          customerName: string
          estimatedValueCents: number
        }
      }
    | null
  followUp:
    | {
        id: string
        customerName: string
        customerPhone: string
        followUpAt: Date | null
        followUpNote: string
        estimatedValueCents: number
      }
    | null
  missedCall:
    | {
        callerName: string
        callerPhone: string
        reason: string
      }
    | null
  newLead:
    | {
        id: string
        customerName: string
        customerPhone: string
        source: string
        estimatedValueCents: number
      }
    | null
}): PriorityAction {
  if (missedCallAssistantIntake) {
    return {
      label: "Do this first",
      title: `Review missed-call assistant intake for ${missedCallAssistantIntake.missedCall.callerName}`,
      description:
        missedCallAssistantIntake.nextAction ||
        missedCallAssistantIntake.summary ||
        `${missedCallAssistantIntake.missedCall.callerPhone} completed the missed-call intake.`,
      href: missedCallAssistantIntake.leadId
        ? `/leads/${missedCallAssistantIntake.leadId}`
        : "/missed-calls",
      buttonLabel: missedCallAssistantIntake.leadId ? "Open lead" : "Open inbox",
    }
  }

  if (sequenceStep) {
    return {
      label: "Do this first",
      title: `${sequenceStep.title} for ${sequenceStep.lead.customerName}`,
      description:
        sequenceStep.message ||
        `${sequenceStep.lead.customerName} is waiting on the next planned touch. Estimated value: ${formatMoney(
          sequenceStep.lead.estimatedValueCents
        )}.`,
      href: `/leads/${sequenceStep.lead.id}`,
      buttonLabel: "Open lead",
    }
  }

  if (followUp) {
    return {
      label: "Do this first",
      title: `Follow up with ${followUp.customerName}`,
      description:
        followUp.followUpNote ||
        `${followUp.customerName} is waiting on a follow-up. Estimated value: ${formatMoney(
          followUp.estimatedValueCents
        )}.`,
      href: `/leads/${followUp.id}`,
      buttonLabel: "Open lead",
    }
  }

  if (missedCall) {
    return {
      label: "Do this first",
      title: `Reply to ${missedCall.callerName}`,
      description: `${missedCall.callerPhone} called about: ${missedCall.reason}`,
      href: "/missed-calls",
      buttonLabel: "Open inbox",
    }
  }

  if (newLead) {
    return {
      label: "Do this first",
      title: `Review ${newLead.customerName}`,
      description: `${leadSourceLabels[newLead.source] ?? "This lead"} is worth an estimated ${formatMoney(
        newLead.estimatedValueCents
      )}.`,
      href: `/leads/${newLead.id}`,
      buttonLabel: "Open lead",
    }
  }

  return {
    label: "Caught up",
    title: "Nothing urgent needs attention",
    description:
      "No overdue follow-ups, new missed calls, or new leads are waiting right now.",
    href: "/leads",
    buttonLabel: "Review Customers/Jobs",
  }
}
