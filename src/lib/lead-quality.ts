type LeadQualityInput = {
  source: string
  status: string
  estimatedValueCents: number
  wonValueCents?: number
  followUpAt: Date | string | null
  followUpCompletedAt: Date | string | null
  createdAt: Date | string
  serviceOfferingId?: string | null
  customerEmail?: string
  appointmentStatus?: string
  conciergeIntakes?: {
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
  const newestIntake = lead.conciergeIntakes?.[0]
  const factors: LeadQualityFactor[] = []
  let score = 35

  function addFactor(label: string, points: number) {
    score += points
    factors.push({ label, points })
  }

  if (lead.status === "WON") {
    addFactor("Already won", 45)
  } else if (lead.status === "CONTACTED") {
    addFactor("Conversation started", 14)
  } else if (lead.status === "NEW") {
    addFactor("New lead", 8)
  } else if (lead.status === "LOST") {
    addFactor("Marked lost", -35)
  }

  if (lead.source === "MISSED_CALL") {
    addFactor("Called directly", 12)
  } else if (lead.source === "REFERRAL") {
    addFactor("Referral source", 10)
  } else if (lead.source === "WEBSITE") {
    addFactor("Website request", 7)
  }

  if (lead.estimatedValueCents >= 75000) {
    addFactor("High estimated value", 14)
  } else if (lead.estimatedValueCents >= 25000) {
    addFactor("Meaningful value", 8)
  } else if (lead.estimatedValueCents > 0) {
    addFactor("Value entered", 4)
  }

  if (lead.serviceOfferingId || newestIntake?.matchedServiceName) {
    addFactor("Matched service", 8)
  }

  if (newestIntake?.quoteRequested) {
    addFactor("Asked for a quote", 6)
  }

  if (newestIntake?.schedulingRequested) {
    addFactor("Asked to schedule", 8)
  }

  if (lead.customerEmail?.trim()) {
    addFactor("Email captured", 3)
  }

  if (followUpAt && !lead.followUpCompletedAt) {
    if (followUpAt < now) {
      addFactor("Follow-up overdue", -12)
    } else {
      addFactor("Follow-up scheduled", 6)
    }
  }

  if (lead.followUpCompletedAt) {
    addFactor("Follow-up completed", 5)
  }

  if (lead.appointmentStatus === "BOOKED") {
    addFactor("Appointment booked", 16)
  } else if (lead.appointmentStatus === "SHOWED") {
    addFactor("Appointment showed", 22)
  } else if (
    lead.appointmentStatus === "NO_SHOW" ||
    lead.appointmentStatus === "CANCELLED"
  ) {
    addFactor("Appointment risk", -18)
  } else if (lead.appointmentStatus === "RESCHEDULED") {
    addFactor("Rescheduled", 5)
  }

  const ageDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (ageDays <= 2) {
    addFactor("Fresh lead", 5)
  } else if (ageDays > 14 && lead.status !== "WON") {
    addFactor("Getting stale", -8)
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
    factors: factors.slice(0, 4),
    reason:
      factors
        .slice(0, 3)
        .map((factor) => factor.label)
        .join(", ") ||
      "Needs more activity before LeadReply can score it well.",
  }
}
