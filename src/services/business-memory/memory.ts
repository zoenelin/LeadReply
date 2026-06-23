export const businessMemoryStatuses = {
  needsReview: "NEEDS_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const

export const businessMemorySourceTypes = [
  { value: "WEBSITE", label: "Website scan or copy" },
  { value: "GOOGLE_PROFILE", label: "Google Business Profile" },
  { value: "FILE_UPLOAD", label: "Uploaded file or document" },
  { value: "API_CONNECTION", label: "Connected software or API" },
  { value: "OWNER_NOTE", label: "Owner note" },
] as const

export const businessMemorySourceTextLimit = 250000

export const businessMemoryCategories = [
  { value: "SERVICES", label: "Services" },
  { value: "PRICING", label: "Prices and estimates" },
  { value: "HOURS", label: "Hours" },
  { value: "SERVICE_AREA", label: "Service area" },
  { value: "BOOKING", label: "Booking rules" },
  { value: "FAQ", label: "Customer questions" },
  { value: "PROMOTION", label: "Offers" },
  { value: "BRAND", label: "Brand voice" },
  { value: "CONTACT", label: "Contact details" },
  { value: "COMPLIANCE", label: "Compliance notes" },
  { value: "GENERAL", label: "General" },
] as const

export type BusinessMemoryCategory =
  (typeof businessMemoryCategories)[number]["value"]

export type BusinessMemoryDraft = {
  category: BusinessMemoryCategory
  title: string
  content: string
  confidence: number
}

type BusinessMemoryItemLike = {
  category: string
  title: string
  content: string
  status: string
  confidence?: number
  sourceType?: string
  sourceName?: string
}

const categoryLabels = businessMemoryCategories.reduce<Record<string, string>>(
  (labels, category) => {
    labels[category.value] = category.label
    return labels
  },
  {}
)

function normalizeLine(line: string) {
  return line
    .replace(/^[\s\-*]+/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function titleFromLine(line: string) {
  const [firstPart] = line.split(/[:|-]/)
  return firstPart.trim().slice(0, 80) || "Business detail"
}

function inferCategory(line: string): BusinessMemoryCategory {
  const lower = line.toLowerCase()

  if (/(price|pricing|cost|\$|fee|estimate|quote|range)/.test(lower)) {
    return "PRICING"
  }

  if (/(hour|open|closed|monday|tuesday|wednesday|thursday|friday|saturday|sunday|am|pm)/.test(lower)) {
    return "HOURS"
  }

  if (/(city|area|county|zip|near|serving|service area|radius|neighborhood)/.test(lower)) {
    return "SERVICE_AREA"
  }

  if (/(book|booking|appointment|reservation|schedule|calendar|walk-in|walk in)/.test(lower)) {
    return "BOOKING"
  }

  if (/(faq|question|ask|how do|what if|can i|do you)/.test(lower)) {
    return "FAQ"
  }

  if (/(discount|promo|promotion|special|offer|coupon|deal)/.test(lower)) {
    return "PROMOTION"
  }

  if (/(tone|brand|voice|friendly|professional|premium|casual|luxury)/.test(lower)) {
    return "BRAND"
  }

  if (/(phone|email|address|contact|call|text)/.test(lower)) {
    return "CONTACT"
  }

  if (/(license|insured|hipaa|legal|allergen|guarantee|warranty|compliance|privacy)/.test(lower)) {
    return "COMPLIANCE"
  }

  if (/(service|repair|install|consult|treatment|menu|class|membership|inspection)/.test(lower)) {
    return "SERVICES"
  }

  return "GENERAL"
}

function confidenceForCategory(category: BusinessMemoryCategory, line: string) {
  if (category === "GENERAL") {
    return 55
  }

  if (/[:$]/.test(line)) {
    return 78
  }

  return 68
}

function dedupeDrafts(drafts: BusinessMemoryDraft[]) {
  const seen = new Set<string>()

  return drafts.filter((draft) => {
    const key = `${draft.category}:${draft.content.toLowerCase()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function extractBusinessMemoryDrafts(text: string): BusinessMemoryDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => line.length >= 8)
    .slice(0, 400)
  const drafts = lines.map((line) => {
    const category = inferCategory(line)

    return {
      category,
      title: titleFromLine(line),
      content: line.slice(0, 1200),
      confidence: confidenceForCategory(category, line),
    }
  })

  return dedupeDrafts(drafts).slice(0, 100)
}

export function getBusinessMemoryCategoryLabel(category: string) {
  return categoryLabels[category] ?? "General"
}

export function formatApprovedBusinessMemoryForPrompt(
  items: BusinessMemoryItemLike[],
  maxItems = 18
) {
  const approvedItems = items
    .filter((item) => item.status === businessMemoryStatuses.approved)
    .slice(0, maxItems)

  if (approvedItems.length === 0) {
    return []
  }

  return approvedItems.map((item) => {
    const label = getBusinessMemoryCategoryLabel(item.category)
    const source = [item.sourceType, item.sourceName].filter(Boolean).join(": ")

    return `${label} - ${item.title}: ${item.content}${
      source ? ` (source: ${source})` : ""
    }`
  })
}

export function getBusinessMemoryStats(items: BusinessMemoryItemLike[]) {
  return {
    total: items.length,
    approved: items.filter(
      (item) => item.status === businessMemoryStatuses.approved
    ).length,
    needsReview: items.filter(
      (item) => item.status === businessMemoryStatuses.needsReview
    ).length,
    rejected: items.filter(
      (item) => item.status === businessMemoryStatuses.rejected
    ).length,
  }
}
