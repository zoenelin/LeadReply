import { getIndustryAiTemplate } from "@/services/ai/industry-templates"
import { getCompliancePromptGuardrails } from "@/services/compliance/guardrails"
import {
  buildAvailabilityGuidance,
  formatDuration,
  formatServiceEstimate,
  type AvailabilityWindowItem,
  type ServiceCatalogItem,
} from "@/lib/domain/service-catalog"

type PromptBusinessMemory = {
  businessName: string
  businessType: string
  city?: string
  state?: string
  website?: string
  phone?: string
  bookingAutomationEnabled?: boolean
  autoSchedulingEnabled?: boolean
  quoteEstimateEnabled?: boolean
  quoteRules?: string
  quoteDisclaimer?: string
  callbackTimeframe?: string
  approvedMemory?: string[]
  services?: ServiceCatalogItem[]
  availabilityWindows?: AvailabilityWindowItem[]
}

type MissedCallAssistantPromptInput = {
  business: PromptBusinessMemory
  answers: Record<string, string>
  baseSummary: Record<string, unknown>
}

function buildServiceCatalogSummary(services: ServiceCatalogItem[] = []) {
  const activeServices = services
    .filter((service) => service.active)
    .sort((left, right) => left.name.localeCompare(right.name))

  if (activeServices.length === 0) {
    return [
      "No configured service catalog yet.",
      "Do not invent service names, prices, durations, or bookable services.",
    ]
  }

  return activeServices.map((service) =>
    [
      service.name,
      service.category ? `Category: ${service.category}` : "",
      service.description ? `Details: ${service.description}` : "",
      `Estimate: ${formatServiceEstimate(service)}`,
      `Duration: ${formatDuration(service.durationMinutes)}`,
      `Online booking: ${service.bookableOnline ? "allowed" : "not allowed"}`,
      `Owner confirmation: ${
        service.ownerConfirmRequired ? "required" : "not required by config"
      }`,
    ]
      .filter(Boolean)
      .join("; ")
  )
}

function buildQuoteRulesSummary({
  quoteRules,
  quoteDisclaimer,
}: {
  quoteRules?: string
  quoteDisclaimer?: string
}) {
  const rules = quoteRules?.trim()
  const disclaimer = quoteDisclaimer?.trim()

  if (!rules && !disclaimer) {
    return "No approved quote rules are configured. Do not provide pricing beyond configured service ranges."
  }

  return [
    rules ? `Approved quote rules: ${rules}` : "",
    disclaimer ? `Required quote disclaimer: ${disclaimer}` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export function buildMissedCallAssistantPrompt({
  business,
  answers,
  baseSummary,
}: MissedCallAssistantPromptInput) {
  const template = getIndustryAiTemplate(business.businessType)
  const location = [business.city, business.state].filter(Boolean).join(", ")
  const serviceCatalog = buildServiceCatalogSummary(business.services)
  const availabilitySummary = buildAvailabilityGuidance(
    business.availabilityWindows ?? []
  )
  const quoteRulesSummary = buildQuoteRulesSummary({
    quoteRules: business.quoteRules,
    quoteDisclaimer: business.quoteDisclaimer,
  })
  const complianceGuardrails = getCompliancePromptGuardrails({
    businessType: business.businessType,
    state: business.state ?? "",
    areas: ["AI_REPLY", "SMS", "BOOKING", "QUOTE"],
  })

  return {
    instructions: [
      "You are LeadReply's missed-call assistant for a local business.",
      "Refine an owner-facing intake summary and next action only.",
      "Keep the business rules, scheduling rules, and quote rules exactly aligned with the provided base summary.",
      "Do not invent services, prices, availability, policies, credentials, discounts, outcomes, or legal/medical advice.",
      `Industry: ${template.label}.`,
      `Customer goal: ${template.customerGoal}.`,
      `Intake focus: ${template.intakeFocus.join("; ")}.`,
      `Likely services: ${template.likelyServices.join("; ") || "configured catalog only"}.`,
      `Urgency signals: ${template.urgencySignals.join("; ")}.`,
      `Owner-review triggers: ${template.ownerReviewTriggers.join("; ")}.`,
      `Scheduling policy: ${template.schedulingPolicy}`,
      `Quote policy: ${template.quotePolicy}`,
      `Compliance focus: ${template.complianceFocus}`,
      `Restricted claims: ${template.restrictedClaims.join(" ")}`,
      "Use the configured service catalog and availability as the source of truth.",
      "Use urgency signals and owner-review triggers to recommend escalation, not to make promises.",
      "If service, quote, schedule, credential, permit, warranty, or safety details are missing, route to owner review.",
      "Use approved business memory as trusted context, but do not invent missing details.",
      "Follow all compliance review rules. If a rule conflicts with a customer request, choose the safer owner-review path.",
      "Return concise JSON only.",
    ].join("\n"),
    input: {
      businessMemory: {
        ...business,
        location,
        approvedMemory: business.approvedMemory ?? [],
      },
      industryTemplate: template,
      serviceCatalog,
      availabilitySummary,
      quoteRulesSummary,
      complianceGuardrails,
      capturedAnswers: answers,
      baseSummary,
    },
  }
}
