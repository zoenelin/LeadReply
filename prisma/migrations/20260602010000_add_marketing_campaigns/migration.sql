CREATE TABLE "MarketingCampaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT '',
  "goal" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "costCents" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT NOT NULL DEFAULT '',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "businessId" TEXT NOT NULL,

  CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead" ADD COLUMN "marketingCampaignId" TEXT;

CREATE INDEX "MarketingCampaign_businessId_idx" ON "MarketingCampaign"("businessId");
CREATE INDEX "MarketingCampaign_businessId_status_idx" ON "MarketingCampaign"("businessId", "status");
CREATE INDEX "Lead_marketingCampaignId_idx" ON "Lead"("marketingCampaignId");

ALTER TABLE "MarketingCampaign"
ADD CONSTRAINT "MarketingCampaign_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_marketingCampaignId_fkey"
FOREIGN KEY ("marketingCampaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "MarketingCampaign" (
  "id",
  "name",
  "channel",
  "status",
  "costCents",
  "createdAt",
  "updatedAt",
  "businessId"
)
SELECT
  'legacy_campaign_' || md5("businessId" || ':' || "campaignName"),
  "campaignName",
  '',
  'ACTIVE',
  MAX("campaignCostCents"),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  "businessId"
FROM "Lead"
WHERE "campaignName" <> ''
GROUP BY "businessId", "campaignName";

UPDATE "Lead"
SET "marketingCampaignId" =
  'legacy_campaign_' || md5("businessId" || ':' || "campaignName")
WHERE "campaignName" <> '';
