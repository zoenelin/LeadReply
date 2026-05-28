import { formatMoney } from "@/lib/lead-options"
import type { ConciergeAnswerMap } from "@/lib/concierge-intake"

export type ServiceCatalogItem = {
  id: string
  name: string
  description: string
  category: string
  estimateLowCents: number
  estimateHighCents: number
  durationMinutes: number
  bookableOnline: boolean
  ownerConfirmRequired: boolean
  active: boolean
}

export type AvailabilityWindowItem = {
  dayOfWeek: number
  startTime: string
  endTime: string
  minimumNoticeHours: number
  active: boolean
}

export const dayOptions = [
  { value: 0, shortLabel: "Sun", label: "Sunday" },
  { value: 1, shortLabel: "Mon", label: "Monday" },
  { value: 2, shortLabel: "Tue", label: "Tuesday" },
  { value: 3, shortLabel: "Wed", label: "Wednesday" },
  { value: 4, shortLabel: "Thu", label: "Thursday" },
  { value: 5, shortLabel: "Fri", label: "Friday" },
  { value: 6, shortLabel: "Sat", label: "Saturday" },
]

const ignoredTokens = new Set([
  "and",
  "are",
  "about",
  "can",
  "for",
  "from",
  "have",
  "help",
  "need",
  "needs",
  "the",
  "this",
  "that",
  "want",
  "wants",
  "with",
])

function normalizeToken(token: string) {
  const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "")

  if (normalized.endsWith("ies") && normalized.length > 4) {
    return `${normalized.slice(0, -3)}y`
  }

  if (normalized.endsWith("s") && normalized.length > 3) {
    return normalized.slice(0, -1)
  }

  return normalized
}

function tokenize(value: string) {
  return value
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !ignoredTokens.has(token))
}

export function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "Duration not set"
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`
  }

  return `${hours} hr ${remainingMinutes} min`
}

export function formatServiceEstimate(service: ServiceCatalogItem) {
  const low = service.estimateLowCents
  const high = service.estimateHighCents

  if (low > 0 && high > 0 && low !== high) {
    return `${formatMoney(low)}-${formatMoney(high)}`
  }

  if (low > 0) {
    return `Starts at ${formatMoney(low)}`
  }

  if (high > 0) {
    return `Up to ${formatMoney(high)}`
  }

  return "Estimate not set"
}

export function formatAvailabilityWindow(window: AvailabilityWindowItem) {
  const day =
    dayOptions.find((option) => option.value === window.dayOfWeek)
      ?.shortLabel ?? "Day"

  return `${day} ${window.startTime}-${window.endTime}`
}

export function buildAvailabilityGuidance(
  availabilityWindows: AvailabilityWindowItem[]
) {
  const activeWindows = availabilityWindows
    .filter((window) => window.active)
    .sort(
      (left, right) =>
        left.dayOfWeek - right.dayOfWeek ||
        left.startTime.localeCompare(right.startTime)
    )

  if (activeWindows.length === 0) {
    return "No availability windows are configured yet."
  }

  const windows = activeWindows.map(formatAvailabilityWindow).join(", ")
  const minimumNotice = Math.max(
    ...activeWindows.map((window) => window.minimumNoticeHours)
  )

  return `Configured availability: ${windows}. Minimum notice: ${minimumNotice} hour${
    minimumNotice === 1 ? "" : "s"
  }.`
}

export function matchServiceFromAnswers({
  answers,
  services,
}: {
  answers: ConciergeAnswerMap
  services: ServiceCatalogItem[]
}) {
  const answerText = Object.values(answers).join(" ")
  const answerTokens = new Set(tokenize(answerText))
  const normalizedAnswerText = ` ${tokenize(answerText).join(" ")} `

  const scoredServices = services
    .filter((service) => service.active)
    .map((service) => {
      const nameTokens = tokenize(service.name)
      const descriptionTokens = tokenize(service.description)
      const serviceTokens = new Set([...nameTokens, ...descriptionTokens])
      let score = 0

      for (const token of serviceTokens) {
        if (answerTokens.has(token)) {
          score += nameTokens.includes(token) ? 3 : 1
        }
      }

      if (
        nameTokens.length > 0 &&
        normalizedAnswerText.includes(` ${nameTokens.join(" ")} `)
      ) {
        score += 6
      }

      return {
        service,
        score,
      }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  return scoredServices[0]?.service ?? null
}
