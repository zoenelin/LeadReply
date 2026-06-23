import { logger } from "@/services/observability/logger"

type ErrorContext = Record<string, unknown>

export function captureException(error: unknown, context: ErrorContext = {}) {
  logger.error("error.captured", {
    ...context,
    error,
  })
}

export function captureMessage(message: string, context: ErrorContext = {}) {
  logger.warn("message.captured", {
    ...context,
    message,
  })
}

