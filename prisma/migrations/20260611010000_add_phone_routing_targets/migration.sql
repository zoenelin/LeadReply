-- CreateTable
CREATE TABLE "BusinessPhoneRouteTarget" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberNormalized" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "businessPhoneLineId" TEXT NOT NULL,

    CONSTRAINT "BusinessPhoneRouteTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneCallRoutingAttempt" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'TWILIO',
    "providerCallSid" TEXT NOT NULL DEFAULT '',
    "providerParentCallSid" TEXT NOT NULL DEFAULT '',
    "callerPhone" TEXT NOT NULL DEFAULT '',
    "callerPhoneNormalized" TEXT NOT NULL DEFAULT '',
    "calledPhoneNumber" TEXT NOT NULL DEFAULT '',
    "calledPhoneNumberNormalized" TEXT NOT NULL DEFAULT '',
    "routedToPhoneNumber" TEXT NOT NULL DEFAULT '',
    "routedToPhoneNumberNormalized" TEXT NOT NULL DEFAULT '',
    "routeLabel" TEXT NOT NULL DEFAULT '',
    "routeOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "businessId" TEXT NOT NULL,
    "businessPhoneLineId" TEXT,
    "missedCallId" TEXT,

    CONSTRAINT "PhoneCallRoutingAttempt_pkey" PRIMARY KEY ("id")
);

-- Backfill existing single routing targets.
INSERT INTO "BusinessPhoneRouteTarget" (
    "id",
    "label",
    "phoneNumber",
    "phoneNumberNormalized",
    "sortOrder",
    "active",
    "createdAt",
    "updatedAt",
    "businessId",
    "businessPhoneLineId"
)
SELECT
    'route_' || "id",
    'Primary',
    "routingTarget",
    "routingTargetNormalized",
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    "businessId",
    "id"
FROM "BusinessPhoneLine"
WHERE "routingTarget" <> '';

-- CreateIndex
CREATE INDEX "BusinessPhoneRouteTarget_businessId_idx" ON "BusinessPhoneRouteTarget"("businessId");

-- CreateIndex
CREATE INDEX "BusinessPhoneRouteTarget_businessPhoneLineId_idx" ON "BusinessPhoneRouteTarget"("businessPhoneLineId");

-- CreateIndex
CREATE INDEX "BusinessPhoneRouteTarget_businessPhoneLineId_active_sortOrder_idx" ON "BusinessPhoneRouteTarget"("businessPhoneLineId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "PhoneCallRoutingAttempt_businessId_idx" ON "PhoneCallRoutingAttempt"("businessId");

-- CreateIndex
CREATE INDEX "PhoneCallRoutingAttempt_businessPhoneLineId_idx" ON "PhoneCallRoutingAttempt"("businessPhoneLineId");

-- CreateIndex
CREATE INDEX "PhoneCallRoutingAttempt_missedCallId_idx" ON "PhoneCallRoutingAttempt"("missedCallId");

-- CreateIndex
CREATE INDEX "PhoneCallRoutingAttempt_providerCallSid_idx" ON "PhoneCallRoutingAttempt"("providerCallSid");

-- CreateIndex
CREATE INDEX "PhoneCallRoutingAttempt_providerParentCallSid_idx" ON "PhoneCallRoutingAttempt"("providerParentCallSid");

-- AddForeignKey
ALTER TABLE "BusinessPhoneRouteTarget" ADD CONSTRAINT "BusinessPhoneRouteTarget_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPhoneRouteTarget" ADD CONSTRAINT "BusinessPhoneRouteTarget_businessPhoneLineId_fkey" FOREIGN KEY ("businessPhoneLineId") REFERENCES "BusinessPhoneLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneCallRoutingAttempt" ADD CONSTRAINT "PhoneCallRoutingAttempt_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneCallRoutingAttempt" ADD CONSTRAINT "PhoneCallRoutingAttempt_businessPhoneLineId_fkey" FOREIGN KEY ("businessPhoneLineId") REFERENCES "BusinessPhoneLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneCallRoutingAttempt" ADD CONSTRAINT "PhoneCallRoutingAttempt_missedCallId_fkey" FOREIGN KEY ("missedCallId") REFERENCES "MissedCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
