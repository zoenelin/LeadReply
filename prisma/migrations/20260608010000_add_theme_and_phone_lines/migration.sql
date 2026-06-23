-- AlterTable
ALTER TABLE "User" ADD COLUMN "themePreference" TEXT NOT NULL DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE "MissedCall" ADD COLUMN "calledPhoneNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MissedCall" ADD COLUMN "routedToPhoneNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MissedCall" ADD COLUMN "routingLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MissedCall" ADD COLUMN "businessPhoneLineId" TEXT;

-- CreateTable
CREATE TABLE "BusinessPhoneLine" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberNormalized" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT 'TWILIO',
    "providerLineId" TEXT NOT NULL DEFAULT '',
    "routingTarget" TEXT NOT NULL DEFAULT '',
    "routingTargetNormalized" TEXT NOT NULL DEFAULT '',
    "routingStrategy" TEXT NOT NULL DEFAULT 'PRIMARY',
    "planRequired" TEXT NOT NULL DEFAULT 'BASIC',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "BusinessPhoneLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPhoneLine_businessId_phoneNumberNormalized_key" ON "BusinessPhoneLine"("businessId", "phoneNumberNormalized");

-- CreateIndex
CREATE INDEX "BusinessPhoneLine_businessId_idx" ON "BusinessPhoneLine"("businessId");

-- CreateIndex
CREATE INDEX "BusinessPhoneLine_businessId_active_idx" ON "BusinessPhoneLine"("businessId", "active");

-- CreateIndex
CREATE INDEX "BusinessPhoneLine_phoneNumberNormalized_idx" ON "BusinessPhoneLine"("phoneNumberNormalized");

-- CreateIndex
CREATE INDEX "MissedCall_businessPhoneLineId_idx" ON "MissedCall"("businessPhoneLineId");

-- AddForeignKey
ALTER TABLE "BusinessPhoneLine" ADD CONSTRAINT "BusinessPhoneLine_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissedCall" ADD CONSTRAINT "MissedCall_businessPhoneLineId_fkey" FOREIGN KEY ("businessPhoneLineId") REFERENCES "BusinessPhoneLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
