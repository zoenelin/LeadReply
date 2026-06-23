export type HomeServiceCategoryOption = {
  value: string
  label: string
}

export type HomeServiceCategoryGroup = {
  group: string
  options: HomeServiceCategoryOption[]
}

export const homeServiceCategories: HomeServiceCategoryGroup[] = [
  {
    group: "Repair and emergency trades",
    options: [
      { value: "HVAC", label: "HVAC" },
      { value: "PLUMBING", label: "Plumbing" },
      { value: "ELECTRICAL", label: "Electrical" },
      { value: "APPLIANCE_REPAIR", label: "Appliance repair" },
      { value: "GARAGE_DOORS", label: "Garage doors" },
    ],
  },
  {
    group: "Exterior and property work",
    options: [
      { value: "ROOFING", label: "Roofing" },
      { value: "LANDSCAPING", label: "Landscaping" },
      { value: "PEST_CONTROL", label: "Pest control" },
      { value: "JUNK_REMOVAL", label: "Junk removal" },
      { value: "MOBILE_DETAILING", label: "Mobile detailing" },
    ],
  },
  {
    group: "Interior and project services",
    options: [
      { value: "CLEANING", label: "Cleaning" },
      { value: "HANDYMAN", label: "Handyman" },
      { value: "PAINTING", label: "Painting" },
      { value: "FLOORING", label: "Flooring" },
      { value: "REMODELING", label: "Remodeling" },
      { value: "HOME_SERVICES", label: "General home services" },
    ],
  },
]

export const homeServiceCategoryOptions = homeServiceCategories.flatMap(
  (group) => group.options
)

export const homeServiceCategoryLabels =
  homeServiceCategoryOptions.reduce<Record<string, string>>((labels, option) => {
    labels[option.value] = option.label
    return labels
  }, {})

export const homeServiceCategoryValues = Object.keys(
  homeServiceCategoryLabels
) as [string, ...string[]]

export function isHomeServiceBusinessType(value: string) {
  return value in homeServiceCategoryLabels
}

export function getHomeServiceCategoryLabel(value: string) {
  return homeServiceCategoryLabels[value] ?? "Home services"
}

export function getHomeServiceComplianceCategory(value: string) {
  return isHomeServiceBusinessType(value) ? "HOME_SERVICES" : value
}
