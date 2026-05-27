CREATE TABLE "FollowUpStep" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "channel" TEXT NOT NULL DEFAULT 'TEXT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "stepOrder" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "FollowUpStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FollowUpStep_businessId_idx" ON "FollowUpStep"("businessId");
CREATE INDEX "FollowUpStep_leadId_idx" ON "FollowUpStep"("leadId");

ALTER TABLE "FollowUpStep" ADD CONSTRAINT "FollowUpStep_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpStep" ADD CONSTRAINT "FollowUpStep_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
