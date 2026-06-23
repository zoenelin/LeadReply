import type { Instrumentation } from "next"
import { captureException } from "@/services/observability/error-monitoring"
import { logger } from "@/services/observability/logger"

// Next.js discovers instrumentation from this root-level file.
export function register() {
  logger.info("observability.registered", {
    runtime: process.env.NEXT_RUNTIME || "nodejs",
  })
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  captureException(error, {
    source: "next_request",
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
  })
}
