export const businessCategories = [
  {
    group: "Vehicle and property",
    options: [
      { value: "AUTOMOTIVE", label: "Automotive" },
      { value: "HOME_SERVICES", label: "Home services" },
      { value: "REAL_ESTATE", label: "Real estate" },
    ],
  },
  {
    group: "Personal services",
    options: [
      { value: "BEAUTY_SERVICES", label: "Beauty services" },
      { value: "MEDICAL_WELLNESS", label: "Medical and wellness" },
      { value: "FITNESS", label: "Fitness" },
    ],
  },
  {
    group: "Local business",
    options: [
      { value: "FOOD_SERVICES", label: "Food and restaurants" },
      { value: "RETAIL", label: "Retail" },
      { value: "PROFESSIONAL_SERVICES", label: "Professional services" },
      { value: "LEGAL", label: "Legal" },
      { value: "OTHER", label: "Other" },
    ],
  },
]

export const businessCategoryLabels = businessCategories
  .flatMap((group) => group.options)
  .reduce<Record<string, string>>((labels, option) => {
    labels[option.value] = option.label
    return labels
  }, {})

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
