export const assignableBusinessRoles = [
  "OWNER",
  "MANAGER",
  "OFFICE",
  "TECHNICIAN",
  "MARKETING",
  "VIEWER",
] as const

export const businessRoles = [
  "OWNER",
  "MANAGER",
  "OFFICE",
  "TECHNICIAN",
  "MARKETING",
  "VIEWER",
  "STAFF",
] as const

export type BusinessRole = (typeof businessRoles)[number]

export type BusinessCapability =
  | "manageBilling"
  | "manageBusinessProfile"
  | "manageTeam"
  | "manageAutomation"
  | "managePhoneLines"
  | "manageLeads"
  | "manageCustomers"
  | "manageJobs"
  | "manageAppointments"
  | "manageMessages"
  | "manageCrmViews"
  | "manageReviews"
  | "requestGrowthServices"
  | "manageMarketing"
  | "manageSeo"
  | "viewAnalytics"
  | "exportData"
  | "viewSettings"

export const roleCapabilities: Record<BusinessRole, BusinessCapability[]> = {
  OWNER: [
    "manageBilling",
    "manageBusinessProfile",
    "manageTeam",
    "manageAutomation",
    "managePhoneLines",
    "manageLeads",
    "manageCustomers",
    "manageJobs",
    "manageAppointments",
    "manageMessages",
    "manageCrmViews",
    "manageReviews",
    "requestGrowthServices",
    "manageMarketing",
    "manageSeo",
    "viewAnalytics",
    "exportData",
    "viewSettings",
  ],
  MANAGER: [
    "manageBusinessProfile",
    "manageTeam",
    "manageAutomation",
    "managePhoneLines",
    "manageLeads",
    "manageCustomers",
    "manageJobs",
    "manageAppointments",
    "manageMessages",
    "manageCrmViews",
    "manageReviews",
    "requestGrowthServices",
    "manageMarketing",
    "manageSeo",
    "viewAnalytics",
    "exportData",
    "viewSettings",
  ],
  OFFICE: [
    "manageLeads",
    "manageCustomers",
    "manageJobs",
    "manageAppointments",
    "manageMessages",
    "manageReviews",
    "viewAnalytics",
    "viewSettings",
  ],
  TECHNICIAN: [
    "manageJobs",
    "manageAppointments",
    "manageMessages",
    "viewSettings",
  ],
  MARKETING: [
    "requestGrowthServices",
    "manageMarketing",
    "manageSeo",
    "viewAnalytics",
    "viewSettings",
  ],
  VIEWER: ["viewAnalytics", "viewSettings"],
  STAFF: [
    "manageLeads",
    "manageCustomers",
    "manageJobs",
    "manageAppointments",
    "manageMessages",
    "manageReviews",
    "viewAnalytics",
    "viewSettings",
  ],
}

export const capabilityLabels: Record<BusinessCapability, string> = {
  manageBilling: "Billing and plan changes",
  manageBusinessProfile: "Business profile",
  manageTeam: "Team access",
  manageAutomation: "Automation settings",
  managePhoneLines: "Phone lines",
  manageLeads: "Customers/Jobs",
  manageCustomers: "Customers",
  manageJobs: "Jobs",
  manageAppointments: "Appointments",
  manageMessages: "Messages",
  manageCrmViews: "Customers/Jobs views and columns",
  manageReviews: "Reviews",
  requestGrowthServices: "Request SEO/marketing help",
  manageMarketing: "Marketing",
  manageSeo: "SEO",
  viewAnalytics: "Analytics",
  exportData: "Export data",
  viewSettings: "Settings",
}

export const businessRoleLabels: Record<BusinessRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  OFFICE: "Office / receptionist",
  TECHNICIAN: "Technician",
  MARKETING: "Marketing",
  VIEWER: "Read only",
  STAFF: "Office / receptionist",
}

export const businessRoleDescriptions: Record<BusinessRole, string> = {
  OWNER: "Full control, including billing, team access, settings, CRM, automation, and reports.",
  MANAGER: "Runs daily operations without billing/payment control.",
  OFFICE: "Works leads, messages, appointments, jobs, notes, and review requests.",
  TECHNICIAN: "Sees assigned job work and can update appointment/job outcomes.",
  MARKETING: "Requests and reviews SEO/marketing work without billing or core settings access.",
  VIEWER: "Can view reporting and read-only settings.",
  STAFF: "Legacy staff role mapped to office/receptionist access.",
}

export const businessRoleOptions = assignableBusinessRoles.map((role) => ({
  value: role,
  label: businessRoleLabels[role],
  description: businessRoleDescriptions[role],
}))

export function roleCan(role: string, capability: BusinessCapability) {
  if (!businessRoles.includes(role as BusinessRole)) {
    return false
  }

  return roleCapabilities[role as BusinessRole].includes(capability)
}
