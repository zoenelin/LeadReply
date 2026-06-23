import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/data/prisma"
import { getRoutingTargetLimit } from "@/services/communications/phone-lines"
import { phoneLookupKey } from "@/services/communications/sms-messages"

export type PhoneRouteTarget = {
  label: string
  phoneNumber: string
  phoneNumberNormalized: string
  sortOrder: number
}

export const missedDialStatuses = new Set([
  "busy",
  "failed",
  "no-answer",
  "canceled",
])

export const answeredDialStatuses = new Set(["completed", "answered"])

export const phoneLineRoutingInclude = {
  business: true,
  routeTargets: {
    where: {
      active: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.BusinessPhoneLineInclude

export type PhoneLineWithRouting = Prisma.BusinessPhoneLineGetPayload<{
  include: typeof phoneLineRoutingInclude
}>

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function parseInteger(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? "", 10)

  return Number.isFinite(parsed) ? parsed : 0
}

export async function findPhoneLineForCalledNumber(calledPhoneNumber: string) {
  const calledPhoneNumberNormalized = phoneLookupKey(calledPhoneNumber)

  if (!calledPhoneNumberNormalized) {
    return null
  }

  return prisma.businessPhoneLine.findFirst({
    where: {
      phoneNumberNormalized: calledPhoneNumberNormalized,
      active: true,
    },
    include: phoneLineRoutingInclude,
  })
}

export async function findPhoneLineById(id: string) {
  return prisma.businessPhoneLine.findFirst({
    where: {
      id,
      active: true,
    },
    include: phoneLineRoutingInclude,
  })
}

export function getRouteTargetsForLine(
  phoneLine: PhoneLineWithRouting
): PhoneRouteTarget[] {
  const routeTargets = phoneLine.routeTargets
    .filter((target) => target.phoneNumberNormalized)
    .map((target) => ({
      label: target.label,
      phoneNumber: target.phoneNumber,
      phoneNumberNormalized: target.phoneNumberNormalized,
      sortOrder: target.sortOrder,
    }))

  const targets =
    routeTargets.length > 0
      ? routeTargets
      : phoneLine.routingTargetNormalized
        ? [
            {
              label: phoneLine.label || "Primary",
              phoneNumber: phoneLine.routingTarget,
              phoneNumberNormalized: phoneLine.routingTargetNormalized,
              sortOrder: 0,
            },
          ]
        : []

  return targets.slice(0, getRoutingTargetLimit(phoneLine.business.selectedPlan))
}

export function getRouteTargetAt(
  phoneLine: PhoneLineWithRouting,
  routeIndex: number
) {
  return getRouteTargetsForLine(phoneLine)[routeIndex] ?? null
}

export function readRouteIndex(url: string) {
  return Math.max(0, parseInteger(new URL(url).searchParams.get("routeIndex")))
}

export async function recordPhoneRoutingAttempt({
  fields,
  phoneLine,
  target,
  routeIndex,
  status,
}: {
  fields: Record<string, string>
  phoneLine: PhoneLineWithRouting
  target: PhoneRouteTarget | null
  routeIndex: number
  status: string
}) {
  const providerCallSid = fields.DialCallSid || fields.CallSid || ""
  const providerParentCallSid = fields.CallSid || ""
  const durationSeconds = parseInteger(
    fields.DialCallDuration || fields.CallDuration
  )
  const existingAttempt = providerCallSid
    ? await prisma.phoneCallRoutingAttempt.findFirst({
        where: {
          providerCallSid,
          routeOrder: routeIndex,
        },
      })
    : null

  if (existingAttempt) {
    return prisma.phoneCallRoutingAttempt.update({
      where: {
        id: existingAttempt.id,
      },
      data: {
        status: status || existingAttempt.status,
        durationSeconds,
        rawPayload: toJson(fields),
        completedAt: new Date(),
      },
    })
  }

  return prisma.phoneCallRoutingAttempt.create({
    data: {
      provider: "TWILIO",
      providerCallSid,
      providerParentCallSid,
      callerPhone: fields.From || fields.Caller || "",
      callerPhoneNormalized: phoneLookupKey(fields.From || fields.Caller || ""),
      calledPhoneNumber: fields.To || fields.Called || "",
      calledPhoneNumberNormalized: phoneLookupKey(fields.To || fields.Called || ""),
      routedToPhoneNumber:
        target?.phoneNumber || fields.DialCallTo || fields.Called || "",
      routedToPhoneNumberNormalized:
        target?.phoneNumberNormalized ||
        phoneLookupKey(fields.DialCallTo || fields.Called || ""),
      routeLabel: target?.label || "",
      routeOrder: routeIndex,
      status: status || "UNKNOWN",
      durationSeconds,
      rawPayload: toJson(fields),
      completedAt: new Date(),
      businessId: phoneLine.businessId,
      businessPhoneLineId: phoneLine.id,
    },
  })
}

export async function linkRoutingAttemptsToMissedCall({
  missedCallId,
  providerParentCallSid,
}: {
  missedCallId: string
  providerParentCallSid: string
}) {
  if (!providerParentCallSid) {
    return
  }

  await prisma.phoneCallRoutingAttempt.updateMany({
    where: {
      providerParentCallSid,
      missedCallId: null,
    },
    data: {
      missedCallId,
    },
  })
}
