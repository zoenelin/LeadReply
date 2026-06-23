export type OpenAiUsage = {
  inputTokens: number
  outputTokens: number
}

export function getOpenAiUsage(data: unknown): OpenAiUsage {
  const record = data as {
    usage?: {
      input_tokens?: number
      output_tokens?: number
    }
  }

  return {
    inputTokens: record.usage?.input_tokens ?? 0,
    outputTokens: record.usage?.output_tokens ?? 0,
  }
}

