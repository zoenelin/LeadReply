CREATE TABLE "GrowthTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'SEO',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "GrowthTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingCalendarItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT '',
    "campaignGoal" TEXT NOT NULL DEFAULT '',
    "contentTheme" TEXT NOT NULL DEFAULT '',
    "offer" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "MarketingCalendarItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GrowthTask_businessId_idx" ON "GrowthTask"("businessId");
CREATE INDEX "GrowthTask_businessId_status_idx" ON "GrowthTask"("businessId", "status");
CREATE INDEX "GrowthTask_dueAt_idx" ON "GrowthTask"("dueAt");
CREATE INDEX "MarketingCalendarItem_businessId_idx" ON "MarketingCalendarItem"("businessId");
CREATE INDEX "MarketingCalendarItem_businessId_status_idx" ON "MarketingCalendarItem"("businessId", "status");
CREATE INDEX "MarketingCalendarItem_scheduledFor_idx" ON "MarketingCalendarItem"("scheduledFor");

ALTER TABLE "GrowthTask" ADD CONSTRAINT "GrowthTask_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketingCalendarItem" ADD CONSTRAINT "MarketingCalendarItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
