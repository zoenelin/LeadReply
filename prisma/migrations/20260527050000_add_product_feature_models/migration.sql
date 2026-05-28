ALTER TABLE "Business" ADD COLUMN "widgetGreeting" TEXT NOT NULL DEFAULT 'Need help? Send us your info and we will follow up soon.';
ALTER TABLE "Business" ADD COLUMN "widgetPrimaryAction" TEXT NOT NULL DEFAULT 'CALLBACK';
ALTER TABLE "Business" ADD COLUMN "widgetAccentColor" TEXT NOT NULL DEFAULT '#0f172a';

ALTER TABLE "Lead" ADD COLUMN "appointmentStatus" TEXT NOT NULL DEFAULT 'NOT_BOOKED';
ALTER TABLE "Lead" ADD COLUMN "appointmentAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "appointmentNotes" TEXT NOT NULL DEFAULT '';

CREATE TABLE "TeamNote" (
  "id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorName" TEXT NOT NULL DEFAULT 'Team',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "leadId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,

  CONSTRAINT "TeamNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeamNote_businessId_idx" ON "TeamNote"("businessId");
CREATE INDEX "TeamNote_leadId_idx" ON "TeamNote"("leadId");

ALTER TABLE "TeamNote" ADD CONSTRAINT "TeamNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamNote" ADD CONSTRAINT "TeamNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
