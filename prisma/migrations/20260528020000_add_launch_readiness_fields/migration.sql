ALTER TABLE "Business" ADD COLUMN "stripeCustomerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "stripeSubscriptionId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "googleReviewUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "googleBusinessProfileUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "launchNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ALTER COLUMN "billingStatus" SET DEFAULT 'PLAN_SELECTED';
UPDATE "Business" SET "billingStatus" = 'PLAN_SELECTED' WHERE "billingStatus" = 'MOCK_ACTIVE';

ALTER TABLE "ReviewRequest" ADD COLUMN "deliveryProvider" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ReviewRequest" ADD COLUMN "providerMessageId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ReviewRequest" ADD COLUMN "deliveryError" TEXT NOT NULL DEFAULT '';

ALTER TABLE "ConciergeIntake" ADD COLUMN "aiProvider" TEXT NOT NULL DEFAULT 'RULES';
ALTER TABLE "ConciergeIntake" ADD COLUMN "aiModel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ConciergeIntake" ADD COLUMN "aiError" TEXT NOT NULL DEFAULT '';

ALTER TABLE "FollowUpStep" ADD COLUMN "deliveryProvider" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FollowUpStep" ADD COLUMN "providerMessageId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FollowUpStep" ADD COLUMN "deliveryError" TEXT NOT NULL DEFAULT '';
