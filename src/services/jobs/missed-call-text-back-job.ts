import { isPhoneOptedOut } from "@/lib/integrations/sms-compliance"
import { prisma } from "@/lib/data/prisma"
import { missedCallStatuses } from "@/lib/domain/status"
import { sendTrackedSms } from "@/services/communications/send-tracked-sms"

function readPayloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key]

  return typeof value === "string" ? value.trim() : ""
}

function appendOptOutLine(message: string) {
  return message.toUpperCase().includes("STOP")
    ? message
    : `${message}\n\nReply STOP to opt out.`
}

export async function runMissedCallTextBackJob({
  missedCallId,
  payload,
  opsJobRunId,
}: {
  missedCallId: string
  payload: Record<string, unknown>
  opsJobRunId?: string
}) {
  const missedCall = await prisma.missedCall.findUnique({
    where: {
      id: missedCallId,
    },
    include: {
      business: true,
      missedCallAssistantIntake: true,
    },
  })

  if (!missedCall) {
    throw new Error("Missed call not found for text-back job.")
  }

  const optedOut = await isPhoneOptedOut(
    missedCall.callerPhone,
    missedCall.businessId
  )

  if (optedOut) {
    return {
      skipped: true,
      reason: "Caller has opted out of SMS.",
    }
  }

  const message =
    readPayloadText(payload, "message") ||
    missedCall.business.replyTemplate.trim() ||
    `Thanks for calling ${missedCall.business.name}. We missed you. Reply with what you need help with and the best time to reach you.`
  const body = appendOptOutLine(message)
  const missedCallAssistantIntakeId = readPayloadText(payload, "missedCallAssistantIntakeId")
  const purpose = readPayloadText(payload, "purpose") || "MISSED_CALL_TEXT_BACK"
  const result = await sendTrackedSms({
    to: missedCall.callerPhone,
    body,
    businessId: missedCall.businessId,
    missedCallId: missedCall.id,
    missedCallAssistantIntakeId: missedCallAssistantIntakeId || missedCall.missedCallAssistantIntake?.id,
    opsJobRunId,
    purpose,
  })

  if (!result.ok) {
    throw new Error(result.reason)
  }

  await prisma.missedCall.update({
    where: {
      id: missedCall.id,
    },
    data: {
      status: missedCallStatuses.replied,
      repliedAt: missedCall.repliedAt ?? new Date(),
    },
  })

  return {
    provider: result.provider,
    messageId: result.messageId,
    deliveryStatus: result.status,
    smsMessageId: result.smsMessageId,
  }
}
