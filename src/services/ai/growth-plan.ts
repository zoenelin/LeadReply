import { env } from "@/lib/config/env"
import { isConfigured } from "@/lib/config/integration-status"
import type { DigitalPresenceBusiness } from "@/lib/growth/digital-presence"
import { getCompliancePromptGuardrails } from "@/services/compliance/guardrails"
import { captureException } from "@/services/observability/error-monitoring"
import { getOpenAiUsage } from "@/services/observability/openai-usage"

type BusinessMemoryInput = DigitalPresenceBusiness & {
  id: string
  name: string
  phone: string
  city: string
  state: string
  businessType: string
  selectedPlan: string
  bookingNotes: string
  seoPrimaryServices: string
  seoServiceAreas: string
  seoTargetKeywords: string
  seoCompetitors: string
  seoWebsitePages: string
  seoContentIdeas: string
  marketingChannels: string
  marketingAudience: string
  marketingGoals: string
  marketingOffer: string
  marketingContentThemes: string
  marketingPostingCadence: string
  marketingBrandVoice: string
  approvedMemory?: string[]
}

export type GrowthPlanRecommendation = {
  title: string
  category: "SEO" | "MARKETING" | "PRESENCE" | "LEAD_CAPTURE" | "REVIEWS"
  priority: "HIGH" | "MEDIUM" | "LOW"
  description: string
  suggestedAction: string
}

export type GeneratedGrowthPlan = {
  title: string
  summary: string
  recommendations: GrowthPlanRecommendation[]
  businessMemory: Record<string, unknown>
  aiProvider: "RULES" | "OPENAI"
  aiModel: string
  aiError: string
  inputTokens: number
  outputTokens: number
}

type AuditFindingLike = {
  category: string
  severity: string
  title: string
  description: string
  recommendation: string
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    recommendations: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          category: {
            type: "string",
            enum: ["SEO", "MARKETING", "PRESENCE", "LEAD_CAPTURE", "REVIEWS"],
          },
          priority: {
            type: "string",
            enum: ["HIGH", "MEDIUM", "LOW"],
          },
          description: { type: "string" },
          suggestedAction: { type: "string" },
        },
        required: [
          "title",
          "category",
          "priority",
          "description",
          "suggestedAction",
        ],
      },
    },
  },
  required: ["title", "summary", "recommendations"],
}

function hasValue(value: string) {
  return value.trim().length > 0
}

function getOutputText(data: unknown) {
  const record = data as {
    output_text?: unknown
    output?: {
      content?: {
        type?: string
        text?: string
      }[]
    }[]
  }

  if (typeof record.output_text === "string") {
    return record.output_text
  }

  return (
    record.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")?.text ?? ""
  )
}

export function buildBusinessMemory({
  business,
  auditFindings,
  leadCount,
  capturedRevenueCents,
}: {
  business: BusinessMemoryInput
  auditFindings: AuditFindingLike[]
  leadCount: number
  capturedRevenueCents: number
}) {
  return {
    business: {
      id: business.id,
      name: business.name,
      phone: business.phone,
      city: business.city,
      state: business.state,
      businessType: business.businessType,
      selectedPlan: business.selectedPlan,
      website: business.website,
      bookingNotes: business.bookingNotes,
    },
    digitalPresence: {
      websitePresenceStatus: business.websitePresenceStatus,
      googleBusinessProfileStatus: business.googleBusinessProfileStatus,
      facebookPageStatus: business.facebookPageStatus,
      instagramProfileStatus: business.instagramProfileStatus,
      bookingLinkStatus: business.bookingLinkStatus,
      reviewPlatformStatus: business.reviewPlatformStatus,
      brandAssetsStatus: business.brandAssetsStatus,
      wantsLeadReplySetupHelp: business.wantsLeadReplySetupHelp,
    },
    seo: {
      primaryServices: business.seoPrimaryServices,
      serviceAreas: business.seoServiceAreas,
      targetKeywords: business.seoTargetKeywords,
      competitors: business.seoCompetitors,
      websitePages: business.seoWebsitePages,
      contentIdeas: business.seoContentIdeas,
    },
    marketing: {
      channels: business.marketingChannels,
      audience: business.marketingAudience,
      goals: business.marketingGoals,
      offer: business.marketingOffer,
      themes: business.marketingContentThemes,
      cadence: business.marketingPostingCadence,
      voice: business.marketingBrandVoice,
    },
    performance: {
      leadCount,
      capturedRevenueCents,
    },
    auditFindings: auditFindings.slice(0, 12),
    approvedMemory: business.approvedMemory ?? [],
    complianceGuardrails: getCompliancePromptGuardrails({
      businessType: business.businessType,
      state: business.state,
      areas: ["MARKETING", "SEO", "REVIEWS", "QUOTE"],
    }),
  }
}

function fallbackRecommendations(
  business: BusinessMemoryInput,
  auditFindings: AuditFindingLike[]
): GrowthPlanRecommendation[] {
  const recommendations: GrowthPlanRecommendation[] = []

  if (!hasValue(business.website)) {
    recommendations.push({
      title: "Create a website readiness plan",
      category: "PRESENCE",
      priority: "HIGH",
      description:
        "The business does not have a website recorded, so LeadReply should still capture leads while preparing copy, services, photos, and setup requirements for a future website package.",
      suggestedAction:
        "Collect homepage copy, service descriptions, photos, logo, contact details, and preferred call-to-action.",
    })
  } else if (auditFindings.length > 0) {
    const urgentFinding = auditFindings.find(
      (finding) => finding.severity === "HIGH"
    )

    recommendations.push({
      title: urgentFinding?.title ?? "Improve website audit findings",
      category: "SEO",
      priority: urgentFinding ? "HIGH" : "MEDIUM",
      description:
        urgentFinding?.description ||
        "The latest website audit found cleanup items that can improve local visibility and conversions.",
      suggestedAction:
        urgentFinding?.recommendation ||
        "Turn the audit findings into SEO and lead-capture tasks.",
    })
  }

  if (!hasValue(business.googleBusinessProfileUrl)) {
    recommendations.push({
      title: "Set up or connect Google Business Profile",
      category: "PRESENCE",
      priority: "HIGH",
      description:
        "Local businesses need a strong Google profile for maps, reviews, and local search trust.",
      suggestedAction:
        "Record the Google profile URL or create a setup opportunity for LeadReply services.",
    })
  }

  if (!hasValue(business.seoPrimaryServices)) {
    recommendations.push({
      title: "Choose highest-value services",
      category: "SEO",
      priority: "HIGH",
      description:
        "SEO and ad copy need to focus on the services most likely to generate profitable customers.",
      suggestedAction:
        "List the top services, especially the ones with strong profit margin or urgent customer demand.",
    })
  }

  if (!hasValue(business.seoServiceAreas)) {
    recommendations.push({
      title: "Define local service areas",
      category: "SEO",
      priority: "HIGH",
      description:
        "LeadReply needs location targets before it can suggest local pages, keywords, and campaigns.",
      suggestedAction:
        "Add city, neighborhood, county, or radius details for the areas this business serves.",
    })
  }

  if (
    !hasValue(business.facebookPageUrl) &&
    !hasValue(business.instagramProfileUrl)
  ) {
    recommendations.push({
      title: "Prepare social profile setup",
      category: "MARKETING",
      priority: "MEDIUM",
      description:
        "The business has no connected Facebook or Instagram presence, which creates a future setup or management opportunity.",
      suggestedAction:
        "Prepare bios, service descriptions, profile images, and first-post ideas for owner approval.",
    })
  }

  if (!hasValue(business.marketingOffer)) {
    recommendations.push({
      title: "Define the first offer",
      category: "MARKETING",
      priority: "MEDIUM",
      description:
        "Campaigns perform better when they have a specific reason for customers to respond now.",
      suggestedAction:
        "Choose a seasonal special, free estimate, first-visit offer, or review-driven campaign.",
    })
  }

  if (!hasValue(business.googleReviewUrl)) {
    recommendations.push({
      title: "Connect review request destination",
      category: "REVIEWS",
      priority: "MEDIUM",
      description:
        "Review requests need a destination so LeadReply can turn happy customers into public trust signals.",
      suggestedAction:
        "Add the Google review link or track Google profile setup as a service opportunity.",
    })
  }

  recommendations.push({
    title: "Track lead source and captured revenue",
    category: "LEAD_CAPTURE",
    priority: "MEDIUM",
    description:
      "LeadReply should connect each captured lead to a source so the business can see which channels make money.",
    suggestedAction:
      "Use campaign/source details on manual leads and connected forms before spending on ads.",
  })

  return recommendations.slice(0, 8)
}

function validateAiRecommendations(value: unknown): GrowthPlanRecommendation[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => item as Partial<GrowthPlanRecommendation>)
    .filter(
      (item): item is GrowthPlanRecommendation =>
        typeof item.title === "string" &&
        typeof item.description === "string" &&
        typeof item.suggestedAction === "string" &&
        (item.category === "SEO" ||
          item.category === "MARKETING" ||
          item.category === "PRESENCE" ||
          item.category === "LEAD_CAPTURE" ||
          item.category === "REVIEWS") &&
        (item.priority === "HIGH" ||
          item.priority === "MEDIUM" ||
          item.priority === "LOW")
    )
    .slice(0, 8)
}

export async function generateGrowthPlan({
  business,
  auditFindings,
  leadCount,
  capturedRevenueCents,
}: {
  business: BusinessMemoryInput
  auditFindings: AuditFindingLike[]
  leadCount: number
  capturedRevenueCents: number
}): Promise<GeneratedGrowthPlan> {
  const businessMemory = buildBusinessMemory({
    business,
    auditFindings,
    leadCount,
    capturedRevenueCents,
  })
  const fallback = fallbackRecommendations(business, auditFindings)
  const basePlan: GeneratedGrowthPlan = {
    title: `${business.name} growth plan`,
    summary:
      "LeadReply created a rules-based growth plan from the business profile, digital presence, SEO setup, marketing setup, lead data, and audit findings.",
    recommendations: fallback,
    businessMemory,
    aiProvider: "RULES",
    aiModel: "",
    aiError: "",
    inputTokens: 0,
    outputTokens: 0,
  }

  if (!isConfigured(env.OPENAI_API_KEY)) {
    return basePlan
  }

  const model = env.OPENAI_MODEL?.trim() || "gpt-5.5"

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY?.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "You create practical LeadReply growth plans for local small businesses. Focus on done-for-you lead capture, digital presence, local SEO, social content, reviews, and measurable ROI. Use approved memory as trusted context. Follow compliance review rules. Do not claim that social posts, SEO rankings, appointments, or revenue are guaranteed. Return concise JSON only.",
        input: JSON.stringify({
          businessMemory,
          fallbackRecommendations: fallback,
        }),
        reasoning: {
          effort: "low",
        },
        max_output_tokens: 1200,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "leadreply_growth_plan",
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    })
    const data = await res.json().catch(() => ({}))
    const usage = getOpenAiUsage(data)

    if (!res.ok) {
      return {
        ...basePlan,
        aiProvider: "OPENAI",
        aiModel: model,
        aiError:
          typeof data.error?.message === "string"
            ? data.error.message
            : "OpenAI request failed.",
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      }
    }

    const parsed = JSON.parse(getOutputText(data)) as {
      title?: unknown
      summary?: unknown
      recommendations?: unknown
    }
    const recommendations = validateAiRecommendations(parsed.recommendations)

    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : basePlan.title,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : basePlan.summary,
      recommendations:
        recommendations.length > 0 ? recommendations : basePlan.recommendations,
      businessMemory,
      aiProvider: "OPENAI",
      aiModel: model,
      aiError: "",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }
  } catch (error) {
    captureException(error, {
      source: "openai.growth_plan",
      businessId: business.id,
      businessType: business.businessType,
      model,
    })

    return {
      ...basePlan,
      aiProvider: "OPENAI",
      aiModel: model,
      aiError: error instanceof Error ? error.message : "OpenAI request failed.",
    }
  }
}
