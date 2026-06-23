type LogLevel = "debug" | "info" | "warn" | "error"

type LogContext = Record<string, unknown>

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const redactPattern = /(authorization|cookie|secret|token|password|api[_-]?key|signature)/i

function configuredLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.toLowerCase()

  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

function shouldLog(level: LogLevel) {
  return levelRank[level] >= levelRank[configuredLevel()]
}

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack,
    }
  }

  if (Array.isArray(value)) {
    return value.map(sanitize)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactPattern.test(key) ? "[redacted]" : sanitize(entry),
      ])
    )
  }

  return value
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  if (!shouldLog(level)) {
    return
  }

  const safeContext = sanitize(context) as LogContext
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...safeContext,
  }
  const line = JSON.stringify(payload)

  if (level === "error") {
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  if (level === "debug") {
    console.debug(line)
    return
  }

  console.info(line)
}

export const logger = {
  debug: (event: string, context?: LogContext) => write("debug", event, context),
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
}
