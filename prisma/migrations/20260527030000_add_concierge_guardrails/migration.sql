ALTER TABLE "Business" ADD COLUMN "autoSchedulingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "quoteEstimateEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "quoteRules" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "quoteDisclaimer" TEXT NOT NULL DEFAULT 'Prices are estimates only. Final pricing is confirmed by the business.';
ALTER TABLE "Business" ADD COLUMN "callbackTimeframe" TEXT NOT NULL DEFAULT 'within one business day';

ALTER TABLE "ConciergeIntake" ADD COLUMN "schedulingMode" TEXT NOT NULL DEFAULT 'OWNER_CONFIRM';
ALTER TABLE "ConciergeIntake" ADD COLUMN "quoteRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ConciergeIntake" ADD COLUMN "quoteGuidance" TEXT NOT NULL DEFAULT '';
