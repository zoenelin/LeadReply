ALTER TABLE "ConciergeIntake" RENAME TO "MissedCallAssistantIntake";

ALTER TABLE "SmsMessage"
RENAME COLUMN "conciergeIntakeId" TO "missedCallAssistantIntakeId";

ALTER INDEX IF EXISTS "ConciergeIntake_missedCallId_key"
RENAME TO "MissedCallAssistantIntake_missedCallId_key";

ALTER INDEX IF EXISTS "ConciergeIntake_businessId_idx"
RENAME TO "MissedCallAssistantIntake_businessId_idx";

ALTER INDEX IF EXISTS "ConciergeIntake_leadId_idx"
RENAME TO "MissedCallAssistantIntake_leadId_idx";

ALTER INDEX IF EXISTS "ConciergeIntake_businessId_adminReviewStatus_idx"
RENAME TO "MissedCallAssistantIntake_businessId_adminReviewStatus_idx";

ALTER INDEX IF EXISTS "ConciergeIntake_adminReviewedAt_idx"
RENAME TO "MissedCallAssistantIntake_adminReviewedAt_idx";

ALTER INDEX IF EXISTS "SmsMessage_conciergeIntakeId_idx"
RENAME TO "SmsMessage_missedCallAssistantIntakeId_idx";

ALTER TABLE "MissedCallAssistantIntake"
RENAME CONSTRAINT "ConciergeIntake_pkey" TO "MissedCallAssistantIntake_pkey";

ALTER TABLE "MissedCallAssistantIntake"
RENAME CONSTRAINT "ConciergeIntake_missedCallId_fkey" TO "MissedCallAssistantIntake_missedCallId_fkey";

ALTER TABLE "MissedCallAssistantIntake"
RENAME CONSTRAINT "ConciergeIntake_businessId_fkey" TO "MissedCallAssistantIntake_businessId_fkey";

ALTER TABLE "MissedCallAssistantIntake"
RENAME CONSTRAINT "ConciergeIntake_leadId_fkey" TO "MissedCallAssistantIntake_leadId_fkey";

ALTER TABLE "SmsMessage"
RENAME CONSTRAINT "SmsMessage_conciergeIntakeId_fkey" TO "SmsMessage_missedCallAssistantIntakeId_fkey";

UPDATE "OpsJobRun"
SET "kind" = 'MISSED_CALL_ASSISTANT_INTAKE'
WHERE "kind" = 'AI_CONCIERGE_INTAKE';
