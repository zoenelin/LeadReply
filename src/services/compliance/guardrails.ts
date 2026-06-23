import { businessCategoryLabels } from "@/lib/domain/business-options"
import { getHomeServiceComplianceCategory } from "@/lib/domain/home-services"

export type ComplianceArea =
  | "AI_REPLY"
  | "SMS"
  | "REVIEWS"
  | "MARKETING"
  | "SEO"
  | "BOOKING"
  | "QUOTE"

export type ComplianceSeverity = "INFO" | "CAUTION" | "REVIEW" | "BLOCK"

export type ComplianceRule = {
  id: string
  title: string
  summary: string
  instruction: string
  areas: ComplianceArea[]
  severity: ComplianceSeverity
  industries?: string[]
  states?: string[]
  sourceName: string
  sourceUrl: string
  lastReviewed: string
}

export type ComplianceContext = {
  businessType: string
  state: string
  areas?: ComplianceArea[]
}

const allAreas: ComplianceArea[] = [
  "AI_REPLY",
  "SMS",
  "REVIEWS",
  "MARKETING",
  "SEO",
  "BOOKING",
  "QUOTE",
]

const stateNames: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
}

const federalRules: ComplianceRule[] = [
  {
    id: "federal-truth-in-advertising",
    title: "Keep advertising truthful and supported",
    summary:
      "Marketing, SEO copy, AI replies, and offers should avoid deceptive claims and should only make objective claims the business can support.",
    instruction:
      "Do not invent guarantees, rankings, credentials, outcomes, prices, discounts, or comparisons. Mark unsupported claims for owner review.",
    areas: ["AI_REPLY", "MARKETING", "SEO", "QUOTE"],
    severity: "REVIEW",
    sourceName: "Federal Trade Commission advertising guidance",
    sourceUrl: "https://www.ftc.gov/business-guidance/advertising-marketing",
    lastReviewed: "2026-06-10",
  },
  {
    id: "federal-review-endorsements",
    title: "Reviews and endorsements must be honest",
    summary:
      "Review requests and testimonials should not be misleading, fabricated, or tied to undisclosed compensation.",
    instruction:
      "Do not write fake reviews, imply every customer had the same result, or hide incentives. If a discount is offered for a review, require clear owner-approved disclosure language.",
    areas: ["REVIEWS", "MARKETING", "SEO"],
    severity: "REVIEW",
    sourceName: "FTC Endorsement Guides",
    sourceUrl:
      "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking",
    lastReviewed: "2026-06-10",
  },
  {
    id: "federal-sms-consent",
    title: "Text automation needs consent and opt-out handling",
    summary:
      "Automated customer texts must respect consent, identity, and opt-out expectations.",
    instruction:
      "Use texting for customer-initiated missed-call follow-up and saved workflows only. Include business identity where appropriate, honor STOP/START opt-outs, and do not send promotional campaigns without proper consent.",
    areas: ["SMS", "AI_REPLY", "MARKETING", "REVIEWS"],
    severity: "BLOCK",
    sourceName: "FCC TCPA rules",
    sourceUrl: "https://www.fcc.gov/sites/default/files/tcpa-rules.pdf",
    lastReviewed: "2026-06-10",
  },
  {
    id: "federal-no-professional-advice",
    title: "Do not provide regulated professional advice",
    summary:
      "AI replies should not replace a licensed professional, diagnosis, legal advice, financial advice, or emergency guidance.",
    instruction:
      "Collect the customer's need and route it to the business. Do not diagnose, promise legal outcomes, give treatment advice, or tell customers to ignore emergencies.",
    areas: ["AI_REPLY", "BOOKING", "MARKETING"],
    severity: "BLOCK",
    sourceName: "LeadReply safety baseline",
    sourceUrl: "https://leadreply.local/docs/compliance",
    lastReviewed: "2026-06-10",
  },
]

const industryRules: ComplianceRule[] = [
  {
    id: "medical-hipaa-marketing",
    title: "Medical marketing may need authorization",
    summary:
      "Medical and wellness businesses can send appointment reminders, but marketing that uses protected health information may require written authorization.",
    instruction:
      "For medical/wellness customers, avoid PHI in marketing drafts. Treat appointment reminders as operational, and mark promotional health messages for owner/legal review.",
    areas: ["AI_REPLY", "SMS", "MARKETING", "BOOKING"],
    severity: "REVIEW",
    industries: ["MEDICAL_WELLNESS"],
    sourceName: "HHS HIPAA marketing guidance",
    sourceUrl:
      "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/marketing/index.html",
    lastReviewed: "2026-06-10",
  },
  {
    id: "medical-appointment-reminders",
    title: "Appointment reminders are generally treatment communications",
    summary:
      "Appointment reminders are generally allowed under HIPAA without separate marketing authorization.",
    instruction:
      "Appointment reminders may be drafted, but keep them minimal and avoid unnecessary health details.",
    areas: ["SMS", "BOOKING", "AI_REPLY"],
    severity: "CAUTION",
    industries: ["MEDICAL_WELLNESS"],
    sourceName: "HHS HIPAA appointment reminder FAQ",
    sourceUrl:
      "https://www.hhs.gov/hipaa/for-professionals/faq/286/are-appointment-reminders-allowed-under-hipaa-without-authorization/index.html",
    lastReviewed: "2026-06-10",
  },
  {
    id: "legal-advertising",
    title: "Legal advertising cannot be false or misleading",
    summary:
      "Law-firm communications should avoid misleading claims, guaranteed results, and unsupported specialization claims.",
    instruction:
      "For legal businesses, do not promise outcomes, compare lawyers without substantiation, or imply specialization unless verified. Mark legal marketing copy for attorney review.",
    areas: ["AI_REPLY", "MARKETING", "SEO", "QUOTE"],
    severity: "BLOCK",
    industries: ["LEGAL"],
    sourceName: "ABA Model Rule 7.1",
    sourceUrl:
      "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_7_1_communication_concerning_a_lawyer_s_services/",
    lastReviewed: "2026-06-10",
  },
  {
    id: "real-estate-fair-housing",
    title: "Real estate content must avoid discriminatory steering",
    summary:
      "Real estate marketing and replies should not steer customers or make discriminatory housing claims.",
    instruction:
      "For real estate, keep replies factual about listings, showings, areas, and next steps. Do not suggest who should live where or make protected-class assumptions.",
    areas: ["AI_REPLY", "MARKETING", "SEO", "BOOKING"],
    severity: "BLOCK",
    industries: ["REAL_ESTATE"],
    sourceName: "HUD Fair Housing Act overview",
    sourceUrl: "https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview",
    lastReviewed: "2026-06-10",
  },
  {
    id: "food-health-allergen-claims",
    title: "Food claims and allergen handling need review",
    summary:
      "Restaurants should avoid unsupported health claims and should handle allergy/safety questions carefully.",
    instruction:
      "For food businesses, do not guarantee allergen-free preparation or make health claims unless the business has approved language. Route allergy-sensitive requests to staff.",
    areas: ["AI_REPLY", "MARKETING", "SEO", "BOOKING"],
    severity: "REVIEW",
    industries: ["FOOD_SERVICES"],
    sourceName: "FDA food labeling and nutrition overview",
    sourceUrl: "https://www.fda.gov/food/food-labeling-nutrition",
    lastReviewed: "2026-06-10",
  },
  {
    id: "home-services-licensing",
    title: "Home-service licensing and emergency claims must be accurate",
    summary:
      "Home-service ads should not imply licensing, insurance, emergency availability, or guarantees unless verified.",
    instruction:
      "For home services, mark licensing, insurance, warranty, emergency response, and guaranteed arrival claims for owner approval unless already approved in business memory.",
    areas: ["AI_REPLY", "MARKETING", "SEO", "QUOTE", "BOOKING"],
    severity: "REVIEW",
    industries: ["HOME_SERVICES"],
    sourceName: "FTC advertising guidance",
    sourceUrl: "https://www.ftc.gov/business-guidance/advertising-marketing",
    lastReviewed: "2026-06-10",
  },
  {
    id: "automotive-estimates",
    title: "Automotive estimates must stay limited",
    summary:
      "Automotive customers often ask for prices, but final cost can depend on diagnostics, parts, labor, taxes, and shop policy.",
    instruction:
      "For automotive, share only configured estimate ranges and disclaimers. Do not promise final repair price, warranty coverage, or completion time without owner approval.",
    areas: ["AI_REPLY", "QUOTE", "MARKETING"],
    severity: "REVIEW",
    industries: ["AUTOMOTIVE"],
    sourceName: "FTC advertising guidance",
    sourceUrl: "https://www.ftc.gov/business-guidance/advertising-marketing",
    lastReviewed: "2026-06-10",
  },
  {
    id: "beauty-wellness-results",
    title: "Beauty results and health-adjacent claims need care",
    summary:
      "Beauty-service marketing should avoid guaranteed results, medical claims, and unverified before/after implications.",
    instruction:
      "For beauty services, avoid guaranteed appearance outcomes, medical treatment language, and exaggerated before/after claims unless owner-approved.",
    areas: ["AI_REPLY", "MARKETING", "SEO", "QUOTE"],
    severity: "REVIEW",
    industries: ["BEAUTY_SERVICES"],
    sourceName: "FTC advertising guidance",
    sourceUrl: "https://www.ftc.gov/business-guidance/advertising-marketing",
    lastReviewed: "2026-06-10",
  },
  {
    id: "fitness-health-results",
    title: "Fitness results cannot be guaranteed",
    summary:
      "Fitness marketing should avoid guaranteed weight loss, health outcomes, or medical promises.",
    instruction:
      "For fitness, avoid guaranteed transformation claims and medical advice. Route injury, diagnosis, nutrition, or treatment questions to staff.",
    areas: ["AI_REPLY", "MARKETING", "SEO"],
    severity: "REVIEW",
    industries: ["FITNESS"],
    sourceName: "FTC health claims guidance",
    sourceUrl: "https://www.ftc.gov/business-guidance/advertising-marketing",
    lastReviewed: "2026-06-10",
  },
]

const highReviewStates = new Set([
  "CA",
  "CO",
  "CT",
  "DE",
  "IA",
  "IN",
  "KY",
  "MD",
  "MN",
  "MT",
  "NE",
  "NH",
  "NJ",
  "OR",
  "RI",
  "TN",
  "TX",
  "UT",
  "VA",
])

function getStateRules(state: string): ComplianceRule[] {
  const normalizedState = normalizeState(state)
  const stateName = stateNames[normalizedState] ?? normalizedState

  if (!normalizedState) {
    return []
  }

  const rules: ComplianceRule[] = [
    {
      id: `state-${normalizedState.toLowerCase()}-consumer-protection`,
      title: `${stateName} consumer-protection review`,
      summary:
        "State unfair/deceptive acts and practices rules can apply to local advertising, offers, reviews, and customer communications.",
      instruction:
        "Keep claims factual and mark discounts, guarantees, licensing, regulated-industry claims, and competitor comparisons for review before publishing.",
      areas: ["AI_REPLY", "MARKETING", "SEO", "REVIEWS", "QUOTE"],
      severity: "CAUTION",
      states: [normalizedState],
      sourceName: "National Association of Attorneys General consumer protection overview",
      sourceUrl: "https://www.naag.org/issues/consumer-protection/consumer-protection-101/",
      lastReviewed: "2026-06-10",
    },
  ]

  if (highReviewStates.has(normalizedState)) {
    rules.push({
      id: `state-${normalizedState.toLowerCase()}-privacy-review`,
      title: `${stateName} privacy and data-use review`,
      summary:
        "This state has, or is commonly tracked for, broader privacy/data-use obligations that can affect marketing, analytics, and customer data handling.",
      instruction:
        "Do not use customer data for unrelated marketing without proper consent. Mark data-sharing, tracking, audience-building, and automated campaign use for admin review.",
      areas: ["MARKETING", "SEO", "SMS", "REVIEWS"],
      severity: "REVIEW",
      states: [normalizedState],
      sourceName: "NCSL state digital privacy law tracker",
      sourceUrl:
        "https://www.ncsl.org/technology-and-communication/state-laws-related-to-digital-privacy",
      lastReviewed: "2026-06-10",
    })
  }

  return rules
}

function normalizeState(state: string) {
  const value = state.trim().toUpperCase()

  if (stateNames[value]) {
    return value
  }

  const match = Object.entries(stateNames).find(
    ([, name]) => name.toUpperCase() === value
  )

  return match?.[0] ?? ""
}

function appliesToContext(rule: ComplianceRule, context: Required<ComplianceContext>) {
  const state = normalizeState(context.state)
  const complianceBusinessType = getHomeServiceComplianceCategory(
    context.businessType
  )
  const matchesIndustry =
    !rule.industries || rule.industries.includes(complianceBusinessType)
  const matchesState = !rule.states || rule.states.includes(state)
  const matchesArea = rule.areas.some((area) => context.areas.includes(area))

  return matchesIndustry && matchesState && matchesArea
}

export function getComplianceRules(context: ComplianceContext) {
  const fullContext: Required<ComplianceContext> = {
    businessType: context.businessType,
    state: context.state,
    areas: context.areas?.length ? context.areas : allAreas,
  }
  const rules = [
    ...federalRules,
    ...industryRules,
    ...getStateRules(fullContext.state),
  ].filter((rule) => appliesToContext(rule, fullContext))

  return rules
}

export function getCompliancePromptGuardrails(context: ComplianceContext) {
  const rules = getComplianceRules(context)

  return rules.map((rule) => ({
    id: rule.id,
    severity: rule.severity,
    title: rule.title,
    instruction: rule.instruction,
    source: rule.sourceName,
  }))
}

export function getComplianceSummary(context: ComplianceContext) {
  const rules = getComplianceRules(context)
  const severeCount = rules.filter(
    (rule) => rule.severity === "BLOCK" || rule.severity === "REVIEW"
  ).length
  const label =
    businessCategoryLabels[context.businessType] ?? "This business category"

  return {
    label,
    state: normalizeState(context.state),
    ruleCount: rules.length,
    severeCount,
    rules,
  }
}
