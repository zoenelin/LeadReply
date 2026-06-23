import { Prisma } from "@prisma/client"
import { env } from "@/lib/config/env"
import { prisma } from "@/lib/data/prisma"
import { communicationStatuses } from "@/lib/domain/status"
import type { SmsResult } from "@/lib/integrations/twilio"

type SmsContextInput = {
  businessId?: string | null
  missedCallId?: string | null
  missedCallAssistantIntakeId?: string | null
  opsJobRunId?: string | null
}

type CreateOutboundSmsMessageInput = SmsContextInput & {
  to: string
  body: string
  purpose?: string
}

type RecordInboundSmsMessageInput = SmsContextInput & {
  fields: Record<string, string>
}

type TwilioStatusInput = {
  messageSid: string
  messageStatus: string
  errorCode?: string
  errorMessage?: string
  fields: Record<string, string>
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function nullableText(value: string | undefined | null) {
  const trimmed = value?.trim() ?? ""

  return trimmed.length > 0 ? trimmed : null
}

function configuredTwilioSender() {
  return (
    env.TWILIO_PHONE_NUMBER?.trim() ||
    env.TWILIO_MESSAGING_SERVICE_SID?.trim() ||
    "TWILIO"
  )
}

export function phoneLookupKey(phone: string) {
  return phone.replace(/\D/g, "")
}

export function phoneNumbersMatch(first: string, second: string) {
  const firstDigits = phoneLookupKey(first)
  const secondDigits = phoneLookupKey(second)

  if (!firstDigits || !secondDigits) {
    return false
  }

  if (firstDigits === secondDigits) {
    return true
  }

  const shortest = Math.min(firstDigits.length, secondDigits.length)

  if (shortest < 7) {
    return false
  }

  return (
    firstDigits.endsWith(secondDigits.slice(-shortest)) ||
    secondDigits.endsWith(firstDigits.slice(-shortest))
  )
}

export function mapTwilioMessageStatus(status: string, direction = "OUTBOUND") {
  if (direction === "INBOUND") {
    return communicationStatuses.received
  }

  const normalized = status.trim().toLowerCase()

  if (normalized === "delivered") {
    return communicationStatuses.delivered
  }

  if (normalized === "sent") {
    return communicationStatuses.sent
  }

  if (normalized === "sending") {
    return communicationStatuses.sending
  }

  if (["failed", "undelivered"].includes(normalized)) {
    return communicationStatuses.failed
  }

  if (["accepted", "queued", "scheduled"].includes(normalized)) {
    return communicationStatuses.queued
  }

  return normalized ? normalized.toUpperCase() : communicationStatuses.queued
}

function statusTimestamps(status: string) {
  const now = new Date()

  if (status === communicationStatuses.delivered) {
    return {
      deliveredAt: now,
      failedAt: null,
    }
  }

  if (status === communicationStatuses.sent) {
    return {
      sentAt: now,
      failedAt: null,
    }
  }

  if (status === communicationStatuses.failed) {
    return {
      failedAt: now,
    }
  }

  return {}
}

export async function createOutboundSmsMessage({
  to,
  body,
  businessId,
  missedCallId,
  missedCallAssistantIntakeId,
  opsJobRunId,
  purpose = "GENERAL",
}: CreateOutboundSmsMessageInput) {
  return prisma.smsMessage.create({
    data: {
      direction: "OUTBOUND",
      status: communicationStatuses.queued,
      provider: "TWILIO",
      fromPhone: configuredTwilioSender(),
      fromPhoneNormalized: phoneLookupKey(configuredTwilioSender()),
      toPhone: to,
      toPhoneNormalized: phoneLookupKey(to),
      body,
      purpose,
      businessId: businessId || null,
      missedCallId: missedCallId || null,
      missedCallAssistantIntakeId: missedCallAssistantIntakeId || null,
      opsJobRunId: opsJobRunId || null,
    },
  })
}

export async function markSmsMessageSent({
  id,
  result,
}: {
  id: string
  result: Extract<SmsResult, { ok: true }>
}) {
  const status = mapTwilioMessageStatus(result.status)

  return prisma.smsMessage.update({
    where: {
      id,
    },
    data: {
      status,
      provider: result.provider,
      providerMessageId: nullableText(result.messageId),
      error: "",
      ...statusTimestamps(status),
    },
  })
}

export async function markSmsMessageFailed({
  id,
  reason,
  providerStatus,
}: {
  id: string
  reason: string
  providerStatus?: string
}) {
  const status = mapTwilioMessageStatus(providerStatus || "failed")

  return prisma.smsMessage.update({
    where: {
      id,
    },
    data: {
      status:
        status === communicationStatuses.failed
          ? communicationStatuses.failed
          : status,
      error: reason,
      failedAt: new Date(),
    },
  })
}

export async function recordInboundSmsMessage({
  fields,
  businessId,
  missedCallId,
  missedCallAssistantIntakeId,
  opsJobRunId,
}: RecordInboundSmsMessageInput) {
  const messageSid = nullableText(fields.MessageSid)

  if (messageSid) {
    const existing = await prisma.smsMessage.findUnique({
      where: {
        providerMessageId: messageSid,
      },
    })

    if (existing) {
      return {
        smsMessage: existing,
        duplicate: true,
      }
    }
  }

  const from = fields.From ?? ""
  const to = fields.To ?? ""
  const smsMessage = await prisma.smsMessage.create({
    data: {
      direction: "INBOUND",
      status: communicationStatuses.received,
      provider: "TWILIO",
      providerMessageId: messageSid,
      fromPhone: from,
      fromPhoneNormalized: phoneLookupKey(from),
      toPhone: to,
      toPhoneNormalized: phoneLookupKey(to),
      body: fields.Body ?? "",
      purpose: "MISSED_CALL_ASSISTANT_REPLY",
      rawPayload: toJson(fields),
      receivedAt: new Date(),
      businessId: businessId || null,
      missedCallId: missedCallId || null,
      missedCallAssistantIntakeId: missedCallAssistantIntakeId || null,
      opsJobRunId: opsJobRunId || null,
    },
  })

  return {
    smsMessage,
    duplicate: false,
  }
}

export async function updateSmsMessageFromTwilioStatus({
  messageSid,
  messageStatus,
  errorCode,
  errorMessage,
  fields,
}: TwilioStatusInput) {
  const status = mapTwilioMessageStatus(messageStatus)
  const failed = status === communicationStatuses.failed
  const error = failed
    ? errorMessage || errorCode || "Twilio reported delivery failure."
    : ""

  return prisma.smsMessage.updateMany({
    where: {
      providerMessageId: messageSid,
    },
    data: {
      status,
      error,
      rawPayload: toJson(fields),
      ...statusTimestamps(status),
    },
  })
}
