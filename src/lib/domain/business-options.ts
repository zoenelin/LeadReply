import {
  homeServiceCategories,
  homeServiceCategoryLabels,
} from "@/lib/domain/home-services"

export const businessCategories = homeServiceCategories

const legacyBusinessCategoryLabels: Record<string, string> = {
  AUTOMOTIVE: "Automotive",
  BEAUTY_SERVICES: "Beauty services",
  FOOD_SERVICES: "Food and restaurants",
  MEDICAL_WELLNESS: "Medical and wellness",
  FITNESS: "Fitness",
  REAL_ESTATE: "Real estate",
  PROFESSIONAL_SERVICES: "Professional services",
  RETAIL: "Retail",
  LEGAL: "Legal",
  OTHER: "Other",
}

export const businessCategoryLabels = {
  ...legacyBusinessCategoryLabels,
  ...homeServiceCategoryLabels,
}

export const planOptions = [
  {
    value: "BASIC",
    label: "Basic",
    tagline: "Lead capture and review support",
    features: ["Missed call inbox", "Saved reply template", "Review prompts"],
  },
  {
    value: "GROWTH",
    label: "Growth",
    tagline: "Basic plus SEO optimization",
    features: [
      "Everything in Basic",
      "Structured SEO setup",
      "Local search profile prompts",
    ],
  },
  {
    value: "COMPLETE",
    label: "Complete",
    tagline: "Full package with marketing support",
    features: [
      "Everything in Growth",
      "Structured marketing plan",
      "Social presence prompts",
    ],
  },
]

export const planLabels = planOptions.reduce<Record<string, string>>(
  (labels, option) => {
    labels[option.value] = option.label
    return labels
  },
  {}
)
