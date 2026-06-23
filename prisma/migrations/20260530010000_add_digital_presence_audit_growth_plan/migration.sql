ALTER TABLE "Business" ADD COLUMN "websitePresenceStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "googleBusinessProfileStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "facebookPageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "facebookPageStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "instagramProfileUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "instagramProfileStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "bookingLinkStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "reviewPlatformStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "brandAssetsStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Business" ADD COLUMN "logoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "brandAssetNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "digitalPresenceNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "wantsLeadReplySetupHelp" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Lead" ADD COLUMN "sourceDetail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "campaignName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "campaignCostCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ServiceOpportunity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'DIGITAL_PRESENCE',
    "estimatedValueCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "ServiceOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteAuditRun" (
    "id" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "score" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL DEFAULT '',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "WebsiteAuditRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteAuditFinding" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "recommendation" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditRunId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "WebsiteAuditFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL DEFAULT 'RULES',
    "aiProvider" TEXT NOT NULL DEFAULT 'RULES',
    "aiModel" TEXT NOT NULL DEFAULT '',
    "aiError" TEXT NOT NULL DEFAULT '',
    "businessMemory" JSONB NOT NULL DEFAULT '{}',
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "GrowthPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'OPENAI',
    "model" TEXT NOT NULL DEFAULT '',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOpportunity_businessId_type_key" ON "ServiceOpportunity"("businessId", "type");
CREATE INDEX "ServiceOpportunity_businessId_idx" ON "ServiceOpportunity"("businessId");
CREATE INDEX "ServiceOpportunity_businessId_status_idx" ON "ServiceOpportunity"("businessId", "status");
CREATE INDEX "WebsiteAuditRun_businessId_idx" ON "WebsiteAuditRun"("businessId");
CREATE INDEX "WebsiteAuditRun_checkedAt_idx" ON "WebsiteAuditRun"("checkedAt");
CREATE INDEX "WebsiteAuditFinding_businessId_idx" ON "WebsiteAuditFinding"("businessId");
CREATE INDEX "WebsiteAuditFinding_auditRunId_idx" ON "WebsiteAuditFinding"("auditRunId");
CREATE INDEX "WebsiteAuditFinding_businessId_status_idx" ON "WebsiteAuditFinding"("businessId", "status");
CREATE INDEX "GrowthPlan_businessId_idx" ON "GrowthPlan"("businessId");
CREATE INDEX "GrowthPlan_businessId_status_idx" ON "GrowthPlan"("businessId", "status");
CREATE INDEX "AiUsageLog_businessId_idx" ON "AiUsageLog"("businessId");
CREATE INDEX "AiUsageLog_feature_idx" ON "AiUsageLog"("feature");
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

ALTER TABLE "ServiceOpportunity" ADD CONSTRAINT "ServiceOpportunity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAuditRun" ADD CONSTRAINT "WebsiteAuditRun_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAuditFinding" ADD CONSTRAINT "WebsiteAuditFinding_auditRunId_fkey" FOREIGN KEY ("auditRunId") REFERENCES "WebsiteAuditRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAuditFinding" ADD CONSTRAINT "WebsiteAuditFinding_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthPlan" ADD CONSTRAINT "GrowthPlan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
