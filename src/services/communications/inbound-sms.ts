import { prisma } from "@/lib/data/prisma"
import { captureException } from "@/services/observability/error-monitoring"
import {
  applyMissedCallAssistantAnswer,
  missedCallAssistantFlowMissedCallInclude,
  type MissedCallAssistantFlowMissedCall,
} from "@/services/communications/missed-call-assistant-flow"
import {
  phoneLookupKey,
  phoneNumbersMatch,
  recordInboundSmsMessage,
} from "@/services/communications/sms-messages"
import { enqueueOpsJob } from "@/services/queue/jobs"

type HandleInboundTwilioSmsInput = {
  fields: Record<string, string>
  requestId?: string
}

async function findMissedCallFromSmsHistory(from: string) {
  const fromKey = phoneLookupKey(from)

  if (!fromKey) {
    return null
  }

  const latestMessage = await prisma.smsMessage.findFirst({
    where: {
      direction: "OUTBOUND",
      toPhoneNormalized: fromKey,
      missedCallId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      missedCall: {
        include: missedCallAssistantFlowMissedCallInclude,
      },
    },
  })

  return latestMessage?.missedCall ?? null
}

async function findRecentMissedCallByPhone(from: string) {
  const candidates = await prisma.missedCall.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    include: missedCallAssistantFlowMissedCallInclude,
  })

  return candidates.find((call) => phoneNumbersMatch(call.callerPhone, from)) ?? null
}

async function findMissedCallForInboundSms(from: string) {
  return (
    (await findMissedCallFromSmsHistory(from)) ??
    (await findRecentMissedCallByPhone(from))
  )
}

async function queueMissedCallAssistantReplyText({
  missedCall,
  message,
  inboundSmsMessageId,
  completed,
}: {
  missedCall: MissedCallAssistantFlowMissedCall
  message: string
  inboundSmsMessageId: string
  completed: boolean
}) {
  const { jobRun } = await enqueueOpsJob({
    type: "MISSED_CALL_TEXT_BACK",
    name: completed
      ? `Missed-call assistant confirmation to ${missedCall.callerName}`
      : `Missed-call assistant question to ${missedCall.callerName}`,
    businessId: missedCall.businessId,
    source: "TWILIO_INBOUND",
    details: completed
      ? "Send the final missed-call assistant confirmation text."
      : "Send the next missed-call assistant intake question.",
    payload: {
      missedCallId: missedCall.id,
      missedCallAssistantIntakeId: missedCall.missedCallAssistantIntake?.id ?? "",
      inboundSmsMessageId,
      message,
      purpose: completed ? "MISSED_CALL_ASSISTANT_CONFIRMATION" : "MISSED_CALL_ASSISTANT_QUESTION",
    },
    dedupeKey: `missed-call-assistant-inbound-reply:${inboundSmsMessageId}`,
    maxAttempts: 3,
  })

  return jobRun
}

export async function handleInboundTwilioSms({
  fields,
  requestId = "",
}: HandleInboundTwilioSmsInput) {
  const from = fields.From ?? ""
  const body = fields.Body?.trim() ?? ""
  const missedCall = await findMissedCallForInboundSms(from)
  const { smsMessage, duplicate } = await recordInboundSmsMessage({
    fields,
    businessId: missedCall?.businessId ?? null,
    missedCallId: missedCall?.id ?? null,
    missedCallAssistantIntakeId: missedCall?.missedCallAssistantIntake?.id ?? null,
  })

  if (duplicate) {
    return {
      matched: Boolean(missedCall),
      duplicate: true,
      queuedReply: false,
      responseMessage: "",
      smsMessage,
    }
  }

  if (!missedCall) {
    return {
      matched: false,
      duplicate: false,
      queuedReply: false,
      responseMessage:
        "Thanks, your message was received. The team will follow up soon.",
      smsMessage,
    }
  }

  if (!missedCall.missedCallAssistantIntake) {
    return {
      matched: true,
      duplicate: false,
      queuedReply: false,
      responseMessage:
        "Thanks, your message was received. The team will follow up soon.",
      smsMessage,
    }
  }

  if (!body) {
    return {
      matched: true,
      duplicate: false,
      queuedReply: false,
      responseMessage: "Thanks, your message was received.",
      smsMessage,
    }
  }

  const result = await applyMissedCallAssistantAnswer({
    missedCall,
    answer: body,
    requestId,
  })

  if (!result.nextMessage) {
    return {
      matched: true,
      duplicate: false,
      queuedReply: false,
      responseMessage:
        "Thanks, your message was received. The team will follow up soon.",
      smsMessage,
    }
  }

  try {
    const replyJob = await queueMissedCallAssistantReplyText({
      missedCall,
      message: result.nextMessage,
      inboundSmsMessageId: smsMessage.id,
      completed: result.completed,
    })

    return {
      matched: true,
      duplicate: false,
      queuedReply: true,
      responseMessage: "",
      smsMessage,
      replyJob,
    }
  } catch (error) {
    captureException(error, {
      requestId,
      source: "services.communications.inbound_sms.reply_queue",
      missedCallId: missedCall.id,
      smsMessageId: smsMessage.id,
    })

    return {
      matched: true,
      duplicate: false,
      queuedReply: false,
      responseMessage: result.nextMessage,
      smsMessage,
    }
  }
}
