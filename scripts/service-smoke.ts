process.env.TWILIO_ACCOUNT_SID = ""
process.env.TWILIO_AUTH_TOKEN = ""
process.env.TWILIO_PHONE_NUMBER = ""
process.env.TWILIO_MESSAGING_SERVICE_SID = ""

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const { prisma } = await import("../src/lib/data/prisma")
  const { communicationStatuses, leadStatuses } = await import(
    "../src/lib/domain/status"
  )
  const { recordInboundSmsMessage } = await import(
    "../src/services/communications/sms-messages"
  )
  const { sendTrackedSms } = await import(
    "../src/services/communications/send-tracked-sms"
  )
  const { getLeadImportPreview, runLeadImportJob } = await import(
    "../src/services/jobs/lead-import-job"
  )
  const { phoneLookupKey } = await import(
    "../src/services/communications/sms-messages"
  )
  const {
    findPhoneLineForCalledNumber,
    getRouteTargetAt,
    getRouteTargetsForLine,
    linkRoutingAttemptsToMissedCall,
    recordPhoneRoutingAttempt,
  } = await import("../src/services/communications/phone-call-routing")
  const { recordMissedCallAndStartMissedCallAssistant } = await import(
    "../src/services/communications/missed-call-automation"
  )
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  let userId = ""
  let businessId = ""

  try {
    const user = await prisma.user.create({
      data: {
        email: `service-smoke-${runId}@example.com`,
        password: "not-used",
      },
    })
    userId = user.id

    const business = await prisma.business.create({
      data: {
        name: "Service Smoke Test",
        phone: "555-0100",
        businessType: "HOME_SERVICES",
        selectedPlan: "COMPLETE",
        userId,
      },
    })
    businessId = business.id

    const failedDelivery = await sendTrackedSms({
      to: "+15555550123",
      body: "Service smoke test message",
      businessId,
      purpose: "SERVICE_SMOKE",
    })

    assert(!failedDelivery.ok, "Expected SMS to fail when Twilio is disabled.")

    const failedSmsMessage = await prisma.smsMessage.findUnique({
      where: {
        id: failedDelivery.smsMessageId,
      },
    })

    assert(failedSmsMessage, "Expected failed SMS message to be recorded.")
    assert(
      failedSmsMessage?.status === communicationStatuses.failed,
      "Expected failed SMS message status to be FAILED."
    )

    const inboundFields = {
      MessageSid: `SM${runId.replace(/[^a-zA-Z0-9]/g, "")}`,
      From: "+15555550123",
      To: "+15555550100",
      Body: "I need help with an estimate.",
    }
    const inbound = await recordInboundSmsMessage({
      businessId,
      fields: inboundFields,
    })
    const duplicateInbound = await recordInboundSmsMessage({
      businessId,
      fields: inboundFields,
    })

    assert(!inbound.duplicate, "Expected first inbound SMS to be unique.")
    assert(duplicateInbound.duplicate, "Expected repeated MessageSid to dedupe.")
    assert(
      inbound.smsMessage.status === communicationStatuses.received,
      "Expected inbound SMS status to be RECEIVED."
    )

    const csv = [
      "name,phone,email,source,status,value,captured_value,notes",
      "Jamie Customer,555-222-1111,jamie@example.com,manual,new,300,,Needs follow-up",
      "Taylor Buyer,555-333-2222,,referral,captured,900,900,Closed from referral",
    ].join("\n")
    const preview = getLeadImportPreview(csv)

    assert(preview.validRows === 2, "Expected two valid lead import rows.")

    const importResult = await runLeadImportJob({
      businessId,
      csv,
    })

    assert(importResult.imported === 2, "Expected two imported leads.")

    const capturedLead = await prisma.lead.findFirst({
      where: {
        businessId,
        status: leadStatuses.captured,
      },
    })

    assert(capturedLead, "Expected captured imported lead to be saved.")
    assert(
      capturedLead?.capturedValueCents === 90000,
      "Expected captured value to be converted to cents."
    )

    const leadReplyNumber = "+15555550100"
    await prisma.businessPhoneLine.create({
      data: {
        label: "Main line",
        phoneNumber: leadReplyNumber,
        phoneNumberNormalized: phoneLookupKey(leadReplyNumber),
        routingTarget: "+15555550101",
        routingTargetNormalized: phoneLookupKey("+15555550101"),
        planRequired: "COMPLETE",
        businessId,
        routeTargets: {
          create: [
            {
              label: "Owner",
              phoneNumber: "+15555550101",
              phoneNumberNormalized: phoneLookupKey("+15555550101"),
              sortOrder: 0,
              businessId,
            },
            {
              label: "Manager",
              phoneNumber: "+15555550102",
              phoneNumberNormalized: phoneLookupKey("+15555550102"),
              sortOrder: 1,
              businessId,
            },
            {
              label: "Backup",
              phoneNumber: "+15555550103",
              phoneNumberNormalized: phoneLookupKey("+15555550103"),
              sortOrder: 2,
              businessId,
            },
          ],
        },
      },
    })

    const completePlanLine = await findPhoneLineForCalledNumber(leadReplyNumber)

    assert(completePlanLine, "Expected LeadReply phone line to be found.")
    assert(
      getRouteTargetsForLine(completePlanLine!).length === 3,
      "Expected Complete plan routing to allow three targets."
    )
    assert(
      getRouteTargetAt(completePlanLine!, 2)?.phoneNumber === "+15555550103",
      "Expected routing target order to be preserved."
    )

    await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        selectedPlan: "GROWTH",
      },
    })

    const growthPlanLine = await findPhoneLineForCalledNumber(leadReplyNumber)

    assert(growthPlanLine, "Expected Growth plan phone line to be found.")
    assert(
      getRouteTargetsForLine(growthPlanLine!).length === 2,
      "Expected Growth plan routing to cap fallback targets at two."
    )

    await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        selectedPlan: "COMPLETE",
      },
    })

    const routedLine = await findPhoneLineForCalledNumber(leadReplyNumber)
    const parentCallSid = `CA${runId.replace(/[^a-zA-Z0-9]/g, "")}`

    assert(routedLine, "Expected phone line for routing-attempt test.")

    const firstAttempt = await recordPhoneRoutingAttempt({
      fields: {
        CallSid: parentCallSid,
        DialCallSid: `${parentCallSid}A`,
        From: "+15555550999",
        To: leadReplyNumber,
        DialCallTo: "+15555550101",
        DialCallDuration: "0",
      },
      phoneLine: routedLine!,
      target: getRouteTargetAt(routedLine!, 0),
      routeIndex: 0,
      status: "no-answer",
    })
    const updatedFirstAttempt = await recordPhoneRoutingAttempt({
      fields: {
        CallSid: parentCallSid,
        DialCallSid: `${parentCallSid}A`,
        From: "+15555550999",
        To: leadReplyNumber,
        DialCallTo: "+15555550101",
        DialCallDuration: "0",
      },
      phoneLine: routedLine!,
      target: getRouteTargetAt(routedLine!, 0),
      routeIndex: 0,
      status: "failed",
    })

    assert(
      updatedFirstAttempt.id === firstAttempt.id,
      "Expected duplicate routing attempt SID to update, not duplicate."
    )
    assert(
      updatedFirstAttempt.status === "failed",
      "Expected routing attempt status to update."
    )

    await recordPhoneRoutingAttempt({
      fields: {
        CallSid: parentCallSid,
        DialCallSid: `${parentCallSid}B`,
        From: "+15555550999",
        To: leadReplyNumber,
        DialCallTo: "+15555550102",
        DialCallDuration: "0",
      },
      phoneLine: routedLine!,
      target: getRouteTargetAt(routedLine!, 1),
      routeIndex: 1,
      status: "busy",
    })

    const missedCallResult = await recordMissedCallAndStartMissedCallAssistant({
      callerName: "Fallback Smoke Caller",
      callerPhone: "+15555550999",
      calledPhoneNumber: leadReplyNumber,
      routedToPhoneNumber: "+15555550102",
      routingLabel: "Manager",
      businessPhoneLineId: routedLine!.id,
      reason: "Service smoke fallback test.",
    })

    assert(missedCallResult.matched, "Expected missed call to match phone line.")
    assert(
      missedCallResult.missedCall,
      "Expected fallback flow to record a missed call."
    )
    assert(
      !missedCallResult.automationStarted,
      "Expected smoke test not to queue live text automation."
    )

    await linkRoutingAttemptsToMissedCall({
      missedCallId: missedCallResult.missedCall!.id,
      providerParentCallSid: parentCallSid,
    })

    const linkedAttemptCount = await prisma.phoneCallRoutingAttempt.count({
      where: {
        missedCallId: missedCallResult.missedCall!.id,
      },
    })

    assert(
      linkedAttemptCount === 2,
      "Expected routing attempts to link back to the missed call."
    )

    console.log("Service smoke checks passed.")
  } finally {
    if (businessId) {
      await prisma.phoneCallRoutingAttempt.deleteMany({ where: { businessId } })
      await prisma.missedCallAssistantIntake.deleteMany({ where: { businessId } })
      await prisma.missedCall.deleteMany({ where: { businessId } })
      await prisma.businessPhoneRouteTarget.deleteMany({ where: { businessId } })
      await prisma.businessPhoneLine.deleteMany({ where: { businessId } })
      await prisma.smsMessage.deleteMany({ where: { businessId } })
      await prisma.lead.deleteMany({ where: { businessId } })
      await prisma.business.deleteMany({ where: { id: businessId } })
    }

    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } })
    }

    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
