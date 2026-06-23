import { env } from "@/lib/config/env"
import { isConfigured } from "@/lib/config/integration-status"
import type {
  AvailabilityWindowItem,
  ServiceCatalogItem,
} from "@/lib/domain/service-catalog"
import { buildMissedCallAssistantPrompt } from "@/services/ai/prompt-builder"
import { captureException } from "@/services/observability/error-monitoring"
import { getOpenAiUsage } from "@/services/observability/openai-usage"

type MissedCallAssistantSummary = {
  intent: string
  urgency: string
  preferredTime: string
  schedulingRequested: boolean
  schedulingMode: string
  quoteRequested: boolean
  quoteGuidance: string
  matchedServiceId: string | null
  matchedServiceName: string
  matchedQuoteLowCents: number
  matchedQuoteHighCents: number
  matchedDurationMinutes: number
  matchedServiceEstimate: string
  matchedServiceDuration: string
  serviceBookableOnline: boolean
  availabilityGuidance: string
  summary: string
  nextAction: string
}

type RefineMissedCallAssistantSummaryInput = {
  baseSummary: MissedCallAssistantSummary
  businessName: string
  businessType: string
  businessCity?: string
  businessState?: string
  businessWebsite?: string
  businessPhone?: string
  bookingAutomationEnabled?: boolean
  autoSchedulingEnabled?: boolean
  quoteEstimateEnabled?: boolean
  quoteRules?: string
  quoteDisclaimer?: string
  callbackTimeframe?: string
  approvedMemory?: string[]
  services?: ServiceCatalogItem[]
  availabilityWindows?: AvailabilityWindowItem[]
  answers: Record<string, string>
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
    },
    nextAction: {
      type: "string",
    },
  },
  required: ["summary", "nextAction"],
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

export function isOpenAiConfigured() {
  return isConfigured(env.OPENAI_API_KEY)
}

export async function refineMissedCallAssistantSummary({
  baseSummary,
  businessName,
  businessType,
  businessCity,
  businessState,
  businessWebsite,
  businessPhone,
  bookingAutomationEnabled,
  autoSchedulingEnabled,
  quoteEstimateEnabled,
  quoteRules,
  quoteDisclaimer,
  callbackTimeframe,
  approvedMemory,
  services,
  availabilityWindows,
  answers,
}: RefineMissedCallAssistantSummaryInput) {
  if (!isOpenAiConfigured()) {
    return {
      summary: baseSummary,
      aiProvider: "RULES",
      aiModel: "",
      aiError: "",
      inputTokens: 0,
      outputTokens: 0,
    }
  }

  const model = env.OPENAI_MODEL?.trim() || "gpt-5.5"
  const prompt = buildMissedCallAssistantPrompt({
    business: {
      businessName,
      businessType,
      city: businessCity,
      state: businessState,
      website: businessWebsite,
      phone: businessPhone,
      bookingAutomationEnabled,
      autoSchedulingEnabled,
      quoteEstimateEnabled,
      quoteRules,
      quoteDisclaimer,
      callbackTimeframe,
      approvedMemory,
      services,
      availabilityWindows,
    },
    answers,
    baseSummary,
  })

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY?.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: prompt.instructions,
        input: JSON.stringify(prompt.input),
        reasoning: {
          effort: "low",
        },
        max_output_tokens: 500,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "leadreply_missed_call_assistant_summary",
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
        summary: baseSummary,
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

    const text = getOutputText(data)
    const parsed = JSON.parse(text) as {
      summary?: unknown
      nextAction?: unknown
    }
    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : baseSummary.summary
    const nextAction =
      typeof parsed.nextAction === "string" && parsed.nextAction.trim()
        ? parsed.nextAction.trim()
        : baseSummary.nextAction

    return {
      summary: {
        ...baseSummary,
        summary,
        nextAction,
      },
      aiProvider: "OPENAI",
      aiModel: model,
      aiError: "",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }
  } catch (error) {
    captureException(error, {
      source: "openai.missed_call_assistant_summary",
      businessType,
      model,
    })

    return {
      summary: baseSummary,
      aiProvider: "OPENAI",
      aiModel: model,
      aiError: error instanceof Error ? error.message : "OpenAI request failed.",
      inputTokens: 0,
      outputTokens: 0,
    }
  }
}
