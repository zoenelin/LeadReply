ALTER TABLE "Business" ADD COLUMN "phoneAutomationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "bookingAutomationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "reviewAutomationEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Business" ADD COLUMN "seoSetupNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "marketingSetupNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "preferredContactMethod" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "Business" ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'MOCK_ACTIVE';

ALTER TABLE "Lead" ADD COLUMN "customerEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "followUpAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "followUpNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "followUpCompletedAt" TIMESTAMP(3);

CREATE TABLE "ReviewRequest" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "leadId" TEXT,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "ReviewRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewRequest_businessId_idx" ON "ReviewRequest"("businessId");
CREATE INDEX "ReviewRequest_leadId_idx" ON "ReviewRequest"("leadId");

ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
