import { env } from "@/lib/env"
import { isConfigured } from "@/lib/integration-status"

type ConciergeSummary = {
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

type RefineConciergeSummaryInput = {
  baseSummary: ConciergeSummary
  businessName: string
  businessType: string
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

export async function refineConciergeSummary({
  baseSummary,
  businessName,
  businessType,
  answers,
}: RefineConciergeSummaryInput) {
  if (!isOpenAiConfigured()) {
    return {
      summary: baseSummary,
      aiProvider: "RULES",
      aiModel: "",
      aiError: "",
    }
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
          "You refine LeadReply missed-call intake summaries for business owners. Keep the exact scheduling and quote guard rails. Do not confirm appointments, prices, medical/legal outcomes, or availability beyond the provided base summary. Return concise JSON only.",
        input: JSON.stringify({
          businessName,
          businessType,
          answers,
          baseSummary,
        }),
        reasoning: {
          effort: "low",
        },
        max_output_tokens: 500,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "leadreply_concierge_summary",
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        summary: baseSummary,
        aiProvider: "OPENAI",
        aiModel: model,
        aiError:
          typeof data.error?.message === "string"
            ? data.error.message
            : "OpenAI request failed.",
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
    }
  } catch (error) {
    return {
      summary: baseSummary,
      aiProvider: "OPENAI",
      aiModel: model,
      aiError: error instanceof Error ? error.message : "OpenAI request failed.",
    }
  }
}
