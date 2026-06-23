const phoneDigitsPattern = /\D/g

export const planPhoneLineLimits: Record<string, number> = {
  BASIC: 1,
  GROWTH: 3,
  COMPLETE: 10,
}

export const planRoutingTargetLimits: Record<string, number> = {
  BASIC: 1,
  GROWTH: 2,
  COMPLETE: 3,
}

export function getPhoneLineLimit(plan: string) {
  return planPhoneLineLimits[plan] ?? planPhoneLineLimits.BASIC
}

export function getRoutingTargetLimit(plan: string) {
  return planRoutingTargetLimits[plan] ?? planRoutingTargetLimits.BASIC
}

export function normalizePhoneNumber(value: string) {
  const digits = value.replace(phoneDigitsPattern, "")

  if (digits.length === 10) {
    return `+1${digits}`
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`
  }

  return digits ? `+${digits}` : ""
}

export function hasReachedPhoneLineLimit({
  currentCount,
  selectedPlan,
}: {
  currentCount: number
  selectedPlan: string
}) {
  return currentCount >= getPhoneLineLimit(selectedPlan)
}

export function getPlanName(plan: string) {
  if (plan === "GROWTH") {
    return "Growth"
  }

  if (plan === "COMPLETE") {
    return "Complete"
  }

  return "Basic"
}
