import { prisma } from "@/lib/data/prisma"
import { missedCallStatuses } from "@/lib/domain/status"
import {
  phoneLookupKey,
  phoneNumbersMatch,
} from "@/services/communications/sms-messages"
import {
  missedCallAssistantFlowMissedCallInclude,
  startMissedCallAssistantIntake,
  type MissedCallAssistantFlowMissedCall,
} from "@/services/communications/missed-call-assistant-flow"

const missedCallDedupeWindowMs = 5 * 60 * 1000

type RecordMissedCallInput = {
  callerName?: string
  callerPhone: string
  calledPhoneNumber: string
  routedToPhoneNumber?: string
  routingLabel?: string
  reason?: string
  businessPhoneLineId?: string
  requestId?: string
}

function cleanText(value: string | undefined | null) {
  return value?.trim() ?? ""
}

function defaultCallerName(phone: string) {
  return phone ? `Caller ${phone}` : "Unknown caller"
}

async function findPhoneLine({
  businessPhoneLineId,
  calledPhoneNumber,
}: {
  businessPhoneLineId?: string
  calledPhoneNumber: string
}) {
  if (businessPhoneLineId) {
    return prisma.businessPhoneLine.findFirst({
      where: {
        id: businessPhoneLineId,
        active: true,
      },
      include: {
        business: true,
      },
    })
  }

  const calledPhoneNumberNormalized = phoneLookupKey(calledPhoneNumber)

  if (!calledPhoneNumberNormalized) {
    return null
  }

  return prisma.businessPhoneLine.findFirst({
    where: {
      phoneNumberNormalized: calledPhoneNumberNormalized,
      active: true,
    },
    include: {
      business: true,
    },
  })
}

async function findRecentDuplicateMissedCall({
  businessId,
  businessPhoneLineId,
  callerPhone,
}: {
  businessId: string
  businessPhoneLineId: string
  callerPhone: string
}) {
  const recentCutoff = new Date(Date.now() - missedCallDedupeWindowMs)
  const recentCalls = await prisma.missedCall.findMany({
    where: {
      businessId,
      businessPhoneLineId,
      createdAt: {
        gte: recentCutoff,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: missedCallAssistantFlowMissedCallInclude,
  })

  return (
    recentCalls.find((call) => phoneNumbersMatch(call.callerPhone, callerPhone)) ??
    null
  )
}

async function createMissedCall({
  callerName,
  callerPhone,
  calledPhoneNumber,
  routedToPhoneNumber,
  routingLabel,
  reason,
  businessId,
  businessPhoneLineId,
}: {
  callerName: string
  callerPhone: string
  calledPhoneNumber: string
  routedToPhoneNumber: string
  routingLabel: string
  reason: string
  businessId: string
  businessPhoneLineId: string
}) {
  return prisma.missedCall.create({
    data: {
      callerName,
      callerPhone,
      reason,
      status: missedCallStatuses.new,
      calledPhoneNumber,
      routedToPhoneNumber,
      routingLabel,
      businessId,
      businessPhoneLineId,
    },
    include: missedCallAssistantFlowMissedCallInclude,
  })
}

export async function recordMissedCallAndStartMissedCallAssistant({
  callerName,
  callerPhone,
  calledPhoneNumber,
  routedToPhoneNumber,
  routingLabel,
  reason,
  businessPhoneLineId,
  requestId = "",
}: RecordMissedCallInput) {
  const cleanedCallerPhone = cleanText(callerPhone)
  const cleanedCalledPhoneNumber = cleanText(calledPhoneNumber)

  if (!cleanedCallerPhone || !cleanedCalledPhoneNumber) {
    return {
      matched: false,
      missedCall: null,
      intake: null,
      textJob: null,
      automationStarted: false,
      alreadyStarted: false,
      reason: "Caller phone and called phone number are required.",
    }
  }

  const phoneLine = await findPhoneLine({
    businessPhoneLineId,
    calledPhoneNumber: cleanedCalledPhoneNumber,
  })

  if (!phoneLine) {
    return {
      matched: false,
      missedCall: null,
      intake: null,
      textJob: null,
      automationStarted: false,
      alreadyStarted: false,
      reason: "No active LeadReply phone line matched the called number.",
    }
  }

  const duplicate = await findRecentDuplicateMissedCall({
    businessId: phoneLine.businessId,
    businessPhoneLineId: phoneLine.id,
    callerPhone: cleanedCallerPhone,
  })
  const missedCall: MissedCallAssistantFlowMissedCall =
    duplicate ??
    (await createMissedCall({
      callerName: cleanText(callerName) || defaultCallerName(cleanedCallerPhone),
      callerPhone: cleanedCallerPhone,
      calledPhoneNumber: cleanedCalledPhoneNumber,
      routedToPhoneNumber:
        cleanText(routedToPhoneNumber) || phoneLine.routingTarget,
      routingLabel: cleanText(routingLabel) || phoneLine.label,
      reason:
        cleanText(reason) ||
        `Missed call to ${phoneLine.business.name}.`,
      businessId: phoneLine.businessId,
      businessPhoneLineId: phoneLine.id,
    }))

  if (!phoneLine.business.phoneAutomationEnabled) {
    return {
      matched: true,
      missedCall,
      intake: missedCall.missedCallAssistantIntake,
      textJob: null,
      automationStarted: false,
      alreadyStarted: Boolean(missedCall.missedCallAssistantIntake),
      reason: "Phone automation is disabled for this business.",
    }
  }

  const result = await startMissedCallAssistantIntake({
    missedCall,
    requestId,
  })

  return {
    matched: true,
    missedCall: result.missedCall,
    intake: result.intake,
    textJob: result.textJob,
    automationStarted: !result.alreadyStarted,
    alreadyStarted: result.alreadyStarted,
    reason: duplicate ? "Duplicate missed call reused." : "Missed call recorded.",
  }
}
