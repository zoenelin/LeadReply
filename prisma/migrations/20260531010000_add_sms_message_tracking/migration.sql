CREATE TABLE "SmsMessage" (
  "id" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "provider" TEXT NOT NULL DEFAULT 'TWILIO',
  "providerMessageId" TEXT,
  "fromPhone" TEXT NOT NULL DEFAULT '',
  "fromPhoneNormalized" TEXT NOT NULL DEFAULT '',
  "toPhone" TEXT NOT NULL DEFAULT '',
  "toPhoneNormalized" TEXT NOT NULL DEFAULT '',
  "body" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'GENERAL',
  "error" TEXT NOT NULL DEFAULT '',
  "rawPayload" JSONB NOT NULL DEFAULT '{}',
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "businessId" TEXT,
  "missedCallId" TEXT,
  "conciergeIntakeId" TEXT,
  "opsJobRunId" TEXT,

  CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmsMessage_providerMessageId_key" ON "SmsMessage"("providerMessageId");
CREATE INDEX "SmsMessage_businessId_idx" ON "SmsMessage"("businessId");
CREATE INDEX "SmsMessage_missedCallId_idx" ON "SmsMessage"("missedCallId");
CREATE INDEX "SmsMessage_conciergeIntakeId_idx" ON "SmsMessage"("conciergeIntakeId");
CREATE INDEX "SmsMessage_opsJobRunId_idx" ON "SmsMessage"("opsJobRunId");
CREATE INDEX "SmsMessage_direction_idx" ON "SmsMessage"("direction");
CREATE INDEX "SmsMessage_status_idx" ON "SmsMessage"("status");
CREATE INDEX "SmsMessage_fromPhoneNormalized_idx" ON "SmsMessage"("fromPhoneNormalized");
CREATE INDEX "SmsMessage_toPhoneNormalized_idx" ON "SmsMessage"("toPhoneNormalized");
CREATE INDEX "SmsMessage_createdAt_idx" ON "SmsMessage"("createdAt");

ALTER TABLE "SmsMessage"
ADD CONSTRAINT "SmsMessage_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SmsMessage"
ADD CONSTRAINT "SmsMessage_missedCallId_fkey"
FOREIGN KEY ("missedCallId") REFERENCES "MissedCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SmsMessage"
ADD CONSTRAINT "SmsMessage_conciergeIntakeId_fkey"
FOREIGN KEY ("conciergeIntakeId") REFERENCES "ConciergeIntake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SmsMessage"
ADD CONSTRAINT "SmsMessage_opsJobRunId_fkey"
FOREIGN KEY ("opsJobRunId") REFERENCES "OpsJobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
