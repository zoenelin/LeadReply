import { normalizeLeadStatus } from "@/lib/domain/lead-options"
import { leadStatuses } from "@/lib/domain/status"

type LeadQualityInput = {
  source: string
  status: string
  estimatedValueCents: number
  capturedValueCents?: number
  followUpAt: Date | string | null
  followUpCompletedAt: Date | string | null
  createdAt: Date | string
  serviceOfferingId?: string | null
  missedCallAssistantIntakes?: {
    status: string
    quoteRequested?: boolean
    schedulingRequested?: boolean
    matchedServiceName?: string
  }[]
  reviewRequests?: {
    id: string
  }[]
}

type LeadQualityFactor = {
  label: string
  points: number
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function getLeadQualityScore(lead: LeadQualityInput) {
  const now = new Date()
  const createdAt = toDate(lead.createdAt) ?? now
  const followUpAt = toDate(lead.followUpAt)
  const newestIntake = lead.missedCallAssistantIntakes?.[0]
  const factors: LeadQualityFactor[] = []
  let score = 35

  function addFactor(label: string, points: number) {
    score += points
    factors.push({ label, points })
  }

  const status = normalizeLeadStatus(lead.status)

  if (status === leadStatuses.captured) {
    addFactor("Captured outcome", 45)
  } else if (status === leadStatuses.current) {
    addFactor("Customer engaged", 14)
  } else if (status === leadStatuses.new) {
    addFactor("New opportunity", 8)
  } else if (status === leadStatuses.closed) {
    addFactor("No active work", -6)
  }

  if (lead.source === "MISSED_CALL") {
    addFactor("Source: direct call", 12)
  } else if (lead.source === "REFERRAL") {
    addFactor("Source: referral", 10)
  } else if (lead.source === "WEBSITE") {
    addFactor("Source: website form", 7)
  }

  if (lead.estimatedValueCents >= 75000) {
    addFactor("High estimated job value", 14)
  } else if (lead.estimatedValueCents >= 25000) {
    addFactor("Moderate estimated job value", 8)
  } else if (lead.estimatedValueCents > 0) {
    addFactor("Estimated value recorded", 4)
  }

  if (lead.serviceOfferingId || newestIntake?.matchedServiceName) {
    addFactor("Service fit identified", 8)
  }

  if (newestIntake?.quoteRequested) {
    addFactor("Quote intent", 6)
  }

  if (newestIntake?.schedulingRequested) {
    addFactor("Scheduling intent", 8)
  }

  if (followUpAt && !lead.followUpCompletedAt) {
    if (followUpAt < now) {
      addFactor("Follow-up risk", -12)
    } else {
      addFactor("Next step scheduled", 6)
    }
  }

  if (lead.followUpCompletedAt) {
    addFactor("Next step completed", 5)
  }

  const ageDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (ageDays <= 2) {
    addFactor("Recent opportunity", 5)
  } else if (
    ageDays > 14 &&
    status !== leadStatuses.captured &&
    status !== leadStatuses.closed
  ) {
    addFactor("Aging opportunity", -8)
  }

  const finalScore = clampScore(score)

  return {
    score: finalScore,
    label:
      finalScore >= 80
        ? "Hot"
        : finalScore >= 60
          ? "Warm"
          : finalScore >= 40
            ? "Watch"
            : "Cold",
    factors,
    reason:
      factors
        .slice(0, 3)
        .map((factor) => factor.label)
        .join(", ") ||
      "Needs more activity before LeadReply can score it well.",
  }
}
