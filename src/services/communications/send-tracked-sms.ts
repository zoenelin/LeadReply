import { sendSms, type SmsResult } from "@/lib/integrations/twilio"
import {
  createOutboundSmsMessage,
  markSmsMessageFailed,
  markSmsMessageSent,
} from "@/services/communications/sms-messages"

type SendTrackedSmsInput = {
  to: string
  body: string
  businessId?: string | null
  missedCallId?: string | null
  missedCallAssistantIntakeId?: string | null
  opsJobRunId?: string | null
  purpose?: string
  statusCallbackPath?: string
}

export type TrackedSmsResult = SmsResult & {
  smsMessageId: string
}

export async function sendTrackedSms({
  to,
  body,
  businessId,
  missedCallId,
  missedCallAssistantIntakeId,
  opsJobRunId,
  purpose = "GENERAL",
  statusCallbackPath = "/api/webhooks/twilio/status",
}: SendTrackedSmsInput): Promise<TrackedSmsResult> {
  const smsMessage = await createOutboundSmsMessage({
    to,
    body,
    businessId,
    missedCallId,
    missedCallAssistantIntakeId,
    opsJobRunId,
    purpose,
  })
  const delivery = await sendSms({
    to,
    body,
    statusCallbackPath,
  })

  if (delivery.ok) {
    const sentMessage = await markSmsMessageSent({
      id: smsMessage.id,
      result: delivery,
    })

    return {
      ...delivery,
      smsMessageId: sentMessage.id,
    }
  }

  const failedMessage = await markSmsMessageFailed({
    id: smsMessage.id,
    reason: delivery.reason,
    providerStatus: delivery.status,
  })

  return {
    ...delivery,
    smsMessageId: failedMessage.id,
  }
}
