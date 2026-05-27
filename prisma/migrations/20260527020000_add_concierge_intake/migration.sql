CREATE TABLE "ConciergeIntake" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "intent" TEXT NOT NULL DEFAULT '',
    "urgency" TEXT NOT NULL DEFAULT '',
    "preferredTime" TEXT NOT NULL DEFAULT '',
    "schedulingRequested" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "missedCallId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "leadId" TEXT,

    CONSTRAINT "ConciergeIntake_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConciergeIntake_missedCallId_key" ON "ConciergeIntake"("missedCallId");
CREATE INDEX "ConciergeIntake_businessId_idx" ON "ConciergeIntake"("businessId");
CREATE INDEX "ConciergeIntake_leadId_idx" ON "ConciergeIntake"("leadId");

ALTER TABLE "ConciergeIntake" ADD CONSTRAINT "ConciergeIntake_missedCallId_fkey" FOREIGN KEY ("missedCallId") REFERENCES "MissedCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConciergeIntake" ADD CONSTRAINT "ConciergeIntake_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciergeIntake" ADD CONSTRAINT "ConciergeIntake_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
