ALTER TABLE "Business"
ADD COLUMN "contactName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contactPhonePrimary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contactPhoneSecondary" TEXT NOT NULL DEFAULT '';

ALTER TABLE "OpsJobRun"
ADD COLUMN "queueName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "queueJobId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "dedupeKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN "attemptsMade" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "payload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "result" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "queuedAt" TIMESTAMP(3),
ADD COLUMN "lastHeartbeatAt" TIMESTAMP(3);

CREATE INDEX "OpsJobRun_queueJobId_idx" ON "OpsJobRun"("queueJobId");
CREATE INDEX "OpsJobRun_dedupeKey_idx" ON "OpsJobRun"("dedupeKey");
CREATE INDEX "OpsJobRun_queuedAt_idx" ON "OpsJobRun"("queuedAt");
