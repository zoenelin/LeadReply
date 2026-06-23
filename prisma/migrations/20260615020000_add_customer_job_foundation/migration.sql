-- Add true CRM foundations while keeping existing Lead records compatible.
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceDetail" TEXT NOT NULL DEFAULT '',
    "estimatedValueCents" INTEGER NOT NULL DEFAULT 0,
    "capturedValueCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "followUpAt" TIMESTAMP(3),
    "followUpNote" TEXT NOT NULL DEFAULT '',
    "followUpCompletedAt" TIMESTAMP(3),
    "appointmentStatus" TEXT NOT NULL DEFAULT 'NOT_BOOKED',
    "appointmentAt" TIMESTAMP(3),
    "appointmentNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "serviceOfferingId" TEXT,
    "marketingCampaignId" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "authorName" TEXT NOT NULL DEFAULT 'System',
    "source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT,
    "leadId" TEXT,

    CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead" ADD COLUMN "customerId" TEXT;

CREATE UNIQUE INDEX "Job_leadId_key" ON "Job"("leadId");
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");
CREATE INDEX "Customer_businessId_phone_idx" ON "Customer"("businessId", "phone");
CREATE INDEX "Customer_businessId_email_idx" ON "Customer"("businessId", "email");
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");
CREATE INDEX "Job_businessId_idx" ON "Job"("businessId");
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");
CREATE INDEX "Job_serviceOfferingId_idx" ON "Job"("serviceOfferingId");
CREATE INDEX "Job_marketingCampaignId_idx" ON "Job"("marketingCampaignId");
CREATE INDEX "Job_businessId_status_idx" ON "Job"("businessId", "status");
CREATE INDEX "Job_appointmentAt_idx" ON "Job"("appointmentAt");
CREATE INDEX "Job_followUpAt_idx" ON "Job"("followUpAt");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX "CustomerActivity_businessId_idx" ON "CustomerActivity"("businessId");
CREATE INDEX "CustomerActivity_customerId_idx" ON "CustomerActivity"("customerId");
CREATE INDEX "CustomerActivity_jobId_idx" ON "CustomerActivity"("jobId");
CREATE INDEX "CustomerActivity_leadId_idx" ON "CustomerActivity"("leadId");
CREATE INDEX "CustomerActivity_occurredAt_idx" ON "CustomerActivity"("occurredAt");
CREATE INDEX "CustomerActivity_type_idx" ON "CustomerActivity"("type");
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_serviceOfferingId_fkey" FOREIGN KEY ("serviceOfferingId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_marketingCampaignId_fkey" FOREIGN KEY ("marketingCampaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Customer" (
    "id",
    "name",
    "phone",
    "email",
    "notes",
    "createdAt",
    "updatedAt",
    "businessId"
)
SELECT
    'customer_' || "id",
    COALESCE(NULLIF("customerName", ''), 'Unknown customer'),
    COALESCE("customerPhone", ''),
    COALESCE("customerEmail", ''),
    '',
    "createdAt",
    CURRENT_TIMESTAMP,
    "businessId"
FROM "Lead";

UPDATE "Lead"
SET "customerId" = 'customer_' || "id"
WHERE "customerId" IS NULL;

INSERT INTO "Job" (
    "id",
    "title",
    "status",
    "source",
    "sourceDetail",
    "estimatedValueCents",
    "capturedValueCents",
    "notes",
    "followUpAt",
    "followUpNote",
    "followUpCompletedAt",
    "appointmentStatus",
    "appointmentAt",
    "appointmentNotes",
    "createdAt",
    "updatedAt",
    "closedAt",
    "businessId",
    "customerId",
    "leadId",
    "serviceOfferingId",
    "marketingCampaignId"
)
SELECT
    'job_' || "id",
    COALESCE(NULLIF("sourceDetail", ''), 'Service request'),
    CASE
        WHEN "status" = 'CLOSED' THEN 'CLOSED'
        WHEN "status" = 'CAPTURED' THEN 'COMPLETED'
        WHEN "appointmentStatus" = 'BOOKED' OR "appointmentAt" IS NOT NULL THEN 'SCHEDULED'
        WHEN "status" = 'CURRENT' OR "status" = 'CONTACTED' THEN 'CURRENT'
        ELSE 'NEW'
    END,
    "source",
    "sourceDetail",
    "estimatedValueCents",
    "capturedValueCents",
    "notes",
    "followUpAt",
    "followUpNote",
    "followUpCompletedAt",
    "appointmentStatus",
    "appointmentAt",
    "appointmentNotes",
    "createdAt",
    CURRENT_TIMESTAMP,
    "closedAt",
    "businessId",
    "customerId",
    "id",
    "serviceOfferingId",
    "marketingCampaignId"
FROM "Lead"
WHERE "customerId" IS NOT NULL;

INSERT INTO "CustomerActivity" (
    "id",
    "type",
    "title",
    "body",
    "authorName",
    "source",
    "occurredAt",
    "createdAt",
    "updatedAt",
    "businessId",
    "customerId",
    "jobId",
    "leadId"
)
SELECT
    'activity_created_' || lead."id",
    'LEAD_CAPTURED',
    'Lead captured',
    COALESCE(NULLIF(lead."sourceDetail", ''), lead."source"),
    'System',
    'MIGRATION',
    lead."createdAt",
    lead."createdAt",
    CURRENT_TIMESTAMP,
    lead."businessId",
    lead."customerId",
    job."id",
    lead."id"
FROM "Lead" lead
LEFT JOIN "Job" job ON job."leadId" = lead."id"
WHERE lead."customerId" IS NOT NULL;

INSERT INTO "CustomerActivity" (
    "id",
    "type",
    "title",
    "body",
    "authorName",
    "source",
    "occurredAt",
    "createdAt",
    "updatedAt",
    "businessId",
    "customerId",
    "jobId",
    "leadId"
)
SELECT
    'activity_note_' || lead."id",
    'NOTE',
    'Initial note',
    lead."notes",
    'System',
    'MIGRATION',
    lead."createdAt",
    lead."createdAt",
    CURRENT_TIMESTAMP,
    lead."businessId",
    lead."customerId",
    job."id",
    lead."id"
FROM "Lead" lead
LEFT JOIN "Job" job ON job."leadId" = lead."id"
WHERE lead."customerId" IS NOT NULL
  AND NULLIF(lead."notes", '') IS NOT NULL;
