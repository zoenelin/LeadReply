ALTER TABLE "MissedCall" ADD COLUMN "convertedLeadId" TEXT;

CREATE UNIQUE INDEX "MissedCall_convertedLeadId_key" ON "MissedCall"("convertedLeadId");

ALTER TABLE "MissedCall" ADD CONSTRAINT "MissedCall_convertedLeadId_fkey" FOREIGN KEY ("convertedLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
