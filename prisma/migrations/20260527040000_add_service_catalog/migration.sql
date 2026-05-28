CREATE TABLE "ServiceOffering" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT '',
  "estimateLowCents" INTEGER NOT NULL DEFAULT 0,
  "estimateHighCents" INTEGER NOT NULL DEFAULT 0,
  "durationMinutes" INTEGER NOT NULL DEFAULT 60,
  "bookableOnline" BOOLEAN NOT NULL DEFAULT false,
  "ownerConfirmRequired" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "businessId" TEXT NOT NULL,

  CONSTRAINT "ServiceOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityWindow" (
  "id" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "minimumNoticeHours" INTEGER NOT NULL DEFAULT 4,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "businessId" TEXT NOT NULL,

  CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead" ADD COLUMN "serviceOfferingId" TEXT;

ALTER TABLE "ConciergeIntake" ADD COLUMN "matchedServiceId" TEXT;
ALTER TABLE "ConciergeIntake" ADD COLUMN "matchedServiceName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ConciergeIntake" ADD COLUMN "matchedQuoteLowCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ConciergeIntake" ADD COLUMN "matchedQuoteHighCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ConciergeIntake" ADD COLUMN "matchedDurationMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ConciergeIntake" ADD COLUMN "serviceBookableOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ConciergeIntake" ADD COLUMN "availabilityGuidance" TEXT NOT NULL DEFAULT '';

CREATE INDEX "ServiceOffering_businessId_idx" ON "ServiceOffering"("businessId");
CREATE INDEX "AvailabilityWindow_businessId_idx" ON "AvailabilityWindow"("businessId");
CREATE INDEX "Lead_serviceOfferingId_idx" ON "Lead"("serviceOfferingId");
CREATE INDEX "ConciergeIntake_matchedServiceId_idx" ON "ConciergeIntake"("matchedServiceId");

ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_serviceOfferingId_fkey" FOREIGN KEY ("serviceOfferingId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConciergeIntake" ADD CONSTRAINT "ConciergeIntake_matchedServiceId_fkey" FOREIGN KEY ("matchedServiceId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
