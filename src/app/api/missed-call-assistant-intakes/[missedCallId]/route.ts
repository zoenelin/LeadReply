import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { captureException } from "@/services/observability/error-monitoring"
import { checkRequestRateLimit, rateLimitResponse } from "@/services/security/rate-limit"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import {
  applyMissedCallAssistantAnswer,
  missedCallAssistantFlowMissedCallInclude,
  startMissedCallAssistantIntake,
} from "@/services/communications/missed-call-assistant-flow"

const missedCallAssistantAnswerSchema = z.object({
  answer: z.string().trim().min(1, "Please enter the customer's answer."),
})

async function findBusinessMissedCall(id: string, businessId: string) {
  return prisma.missedCall.findFirst({
    where: {
      id,
      businessId,
    },
    include: missedCallAssistantFlowMissedCallInclude,
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ missedCallId: string }> }
) {
  const requestId = req.headers.get("x-request-id") || ""
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, "missed-call-assistant-intake", {
    limit: 40,
    windowMs: 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  const auth = await requireApiBusinessAccess("manageMessages", req)

  if ("response" in auth) {
    return auth.response
  }

  const { missedCallId } = await params
  const missedCall = await findBusinessMissedCall(
    missedCallId,
    auth.access.businessId
  )

  if (!missedCall) {
    return Response.json({ error: "Missed call not found." }, { status: 404 })
  }

  try {
    const result = await startMissedCallAssistantIntake({
      missedCall,
      requestId,
    })

    return Response.json(result, { status: result.alreadyStarted ? 200 : 201 })
  } catch (error) {
    captureException(error, {
      requestId,
      source: "api.missed_call_assistant_intake.start",
      missedCallId,
    })

    return Response.json(
      { error: "Something went wrong starting the missed-call assistant intake." },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ missedCallId: string }> }
) {
  const requestId = req.headers.get("x-request-id") || ""
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const rateLimit = checkRequestRateLimit(req, "missed-call-assistant-answer", {
    limit: 80,
    windowMs: 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  const auth = await requireApiBusinessAccess("manageMessages", req)

  if ("response" in auth) {
    return auth.response
  }

  const { missedCallId } = await params
  const missedCall = await findBusinessMissedCall(
    missedCallId,
    auth.access.businessId
  )

  if (!missedCall?.missedCallAssistantIntake) {
    return Response.json(
      { error: "Start the missed-call assistant intake first." },
      { status: 404 }
    )
  }

  try {
    const body = await req.json()
    const result = missedCallAssistantAnswerSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const completed = await applyMissedCallAssistantAnswer({
      missedCall,
      answer: result.data.answer,
      requestId,
    })

    return Response.json(completed)
  } catch (error) {
    captureException(error, {
      requestId,
      source: "api.missed_call_assistant_intake.answer",
      missedCallId,
    })

    const message =
      error instanceof Error && error.message === "No question is waiting."
        ? error.message
        : "Something went wrong updating the missed-call assistant intake."
    const status =
      error instanceof Error && error.message === "No question is waiting."
        ? 400
        : 500

    return Response.json({ error: message }, { status })
  }
}
