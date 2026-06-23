-- Add admin review fields for AI concierge intake approvals.
ALTER TABLE "ConciergeIntake"
ADD COLUMN "adminReviewStatus" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
ADD COLUMN "adminReviewSummary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "adminReviewNextAction" TEXT NOT NULL DEFAULT '',
ADD COLUMN "adminReviewNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "adminReviewedAt" TIMESTAMP(3),
ADD COLUMN "adminReviewedByEmail" TEXT NOT NULL DEFAULT '';

CREATE INDEX "ConciergeIntake_businessId_adminReviewStatus_idx"
ON "ConciergeIntake"("businessId", "adminReviewStatus");

CREATE INDEX "ConciergeIntake_adminReviewedAt_idx"
ON "ConciergeIntake"("adminReviewedAt");
