import { getLostRevenueStats } from "@/lib/lost-revenue"
import { getResponseSpeedStats } from "@/lib/response-speed"

type BusinessHealthBusiness = {
  name: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  businessType: string
  selectedPlan: string
  onboardingComplete: boolean
  replyTemplate: string
}

type BusinessHealthLead = {
  id: string
  customerName: string
  customerPhone: string
  source: string
  status: string
  estimatedValueCents: number
  followUpAt: Date | null
  followUpCompletedAt: Date | null
  createdAt: Date
}

type BusinessHealthMissedCall = {
  id: string
  callerName: string
  callerPhone: string
  reason: string
  status: string
  repliedAt: Date | null
  createdAt: Date
}

type BusinessHealthInput = {
  business: BusinessHealthBusiness
  leads: BusinessHealthLead[]
  missedCalls: BusinessHealthMissedCall[]
  reviewRequestCount: number
  missedCallValueCents: number
}

type HealthFactor = {
  label: string
  score: number
  maxScore: number
  message: string
  href: string
}

const openLeadStatuses = new Set(["NEW", "CONTACTED"])

function clampScore(score: number, maxScore: number) {
  return Math.max(0, Math.min(maxScore, Math.round(score)))
}

function factorScorePercent(factor: HealthFactor) {
  if (factor.maxScore === 0) {
    return 0
  }

  return factor.score / factor.maxScore
}

function getFactorStatus(factor: HealthFactor) {
  const percent = factorScorePercent(factor)

  if (percent >= 0.85) {
    return "Strong"
  }

  if (percent >= 0.6) {
    return "Okay"
  }

  return "Needs work"
}

export function getBusinessHealthStats({
  business,
  leads,
  missedCalls,
  reviewRequestCount,
  missedCallValueCents,
}: BusinessHealthInput) {
  const now = new Date()
  const profileFields = [
    business.name,
    business.phone,
    business.address,
    business.city,
    business.state,
    business.zip,
    business.businessType,
    business.selectedPlan,
  ]
  const completeProfileFields = profileFields.filter((value) =>
    Boolean(value.trim())
  ).length
  const setupScore = clampScore(
    (completeProfileFields / profileFields.length) * 18 +
      (business.onboardingComplete ? 4 : 0) +
      (business.replyTemplate.trim() ? 3 : 0),
    25
  )
  const responseStats = getResponseSpeedStats(missedCalls)
  const responseBaseScore =
    responseStats.averageMinutes === null
      ? missedCalls.length === 0
        ? 14
        : 10
      : responseStats.averageMinutes <= 15
        ? 20
        : responseStats.averageMinutes <= 60
          ? 17
          : responseStats.averageMinutes <= 240
            ? 12
            : 7
  const responseScore = clampScore(
    responseBaseScore - Math.min(8, responseStats.waitingCount * 3),
    20
  )
  const openLeads = leads.filter((lead) => openLeadStatuses.has(lead.status))
  const overdueLeads = openLeads.filter(
    (lead) =>
      lead.followUpAt && lead.followUpAt < now && !lead.followUpCompletedAt
  )
  const scheduledOpenLeads = openLeads.filter((lead) => lead.followUpAt)
  const followUpScore =
    openLeads.length === 0
      ? 15
      : clampScore(
          ((openLeads.length - overdueLeads.length) / openLeads.length) * 14 +
            (scheduledOpenLeads.length / openLeads.length) * 6,
          20
        )
  const lostRevenueStats = getLostRevenueStats({
    leads,
    missedCalls,
    missedCallValueCents,
  })
  const pipelineCents = openLeads.reduce(
    (total, lead) => total + lead.estimatedValueCents,
    0
  )
  const revenueRiskRatio =
    pipelineCents === 0
      ? lostRevenueStats.totalAtRiskCents > 0
        ? 1
        : 0
      : lostRevenueStats.totalAtRiskCents / pipelineCents
  const revenueScore = clampScore(20 - Math.min(16, revenueRiskRatio * 20), 20)
  const wonLeadCount = leads.filter((lead) => lead.status === "WON").length
  const reviewScore =
    wonLeadCount === 0
      ? 10
      : clampScore((reviewRequestCount / wonLeadCount) * 15, 15)
  const factors: HealthFactor[] = [
    {
      label: "Setup",
      score: setupScore,
      maxScore: 25,
      message:
        setupScore >= 22
          ? "Business profile and setup are in good shape."
          : "Finish profile details and save a reply template.",
      href: "/settings/business",
    },
    {
      label: "Reply speed",
      score: responseScore,
      maxScore: 20,
      message:
        responseStats.waitingCount === 0
          ? "Missed-call replies are under control."
          : `${responseStats.waitingCount} missed call${
              responseStats.waitingCount === 1 ? "" : "s"
            } still need a reply.`,
      href: "/missed-calls",
    },
    {
      label: "Follow-ups",
      score: followUpScore,
      maxScore: 20,
      message:
        overdueLeads.length === 0
          ? "No overdue follow-ups are showing."
          : `${overdueLeads.length} lead${
              overdueLeads.length === 1 ? "" : "s"
            } need follow-up.`,
      href: "/leads",
    },
    {
      label: "Revenue protection",
      score: revenueScore,
      maxScore: 20,
      message:
        lostRevenueStats.totalAtRiskCents === 0
          ? "No open revenue leak is showing right now."
          : `${lostRevenueStats.actionItemCount} item${
              lostRevenueStats.actionItemCount === 1 ? "" : "s"
            } could still be recovered.`,
      href: "/analytics",
    },
    {
      label: "Reviews",
      score: reviewScore,
      maxScore: 15,
      message:
        wonLeadCount === 0
          ? "Win a customer, then request the review."
          : `${reviewRequestCount} review request${
              reviewRequestCount === 1 ? "" : "s"
            } tracked for ${wonLeadCount} captured customer${
              wonLeadCount === 1 ? "" : "s"
            }.`,
      href: "/leads",
    },
  ]
  const score = factors.reduce((total, factor) => total + factor.score, 0)
  const sortedFactors = [...factors].sort(
    (left, right) => factorScorePercent(left) - factorScorePercent(right)
  )
  const weakestFactor = sortedFactors[0]

  return {
    score,
    label: getBusinessHealthLabel(score),
    message: getBusinessHealthMessage(score, weakestFactor),
    factors: factors.map((factor) => ({
      ...factor,
      status: getFactorStatus(factor),
    })),
    weakestFactor,
    responseStats,
    lostRevenueStats,
  }
}

export function getBusinessHealthLabel(score: number) {
  if (score >= 85) {
    return "Excellent"
  }

  if (score >= 70) {
    return "Good"
  }

  if (score >= 50) {
    return "Needs attention"
  }

  return "Needs setup"
}

export function getBusinessHealthMessage(
  score: number,
  weakestFactor: HealthFactor
) {
  if (score >= 85) {
    return "LeadReply is showing a healthy business workflow."
  }

  if (score >= 70) {
    return `${weakestFactor.label} is the best next place to tighten up.`
  }

  return `Start with ${weakestFactor.label.toLowerCase()} to improve the score fastest.`
}
