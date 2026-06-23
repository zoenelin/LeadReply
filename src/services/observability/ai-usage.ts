import { prisma } from "@/lib/data/prisma"
import { captureException } from "@/services/observability/error-monitoring"

type AiUsageStatus = "SUCCESS" | "ERROR" | "SKIPPED"

type AiUsageInput = {
  businessId?: string | null
  feature: string
  provider: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  estimatedCostCents?: number
  status: AiUsageStatus
  error?: string
}

export async function recordAiUsage({
  businessId,
  feature,
  provider,
  model = "",
  inputTokens = 0,
  outputTokens = 0,
  estimatedCostCents = 0,
  status,
  error = "",
}: AiUsageInput) {
  try {
    await prisma.aiUsageLog.create({
      data: {
        businessId: businessId || undefined,
        feature,
        provider,
        model,
        inputTokens,
        outputTokens,
        estimatedCostCents,
        status,
        error,
      },
    })
  } catch (logError) {
    captureException(logError, {
      source: "ai_usage_log",
      feature,
      provider,
      businessId,
    })
  }
}

