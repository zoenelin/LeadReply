-- CreateTable
CREATE TABLE "BusinessMemorySource" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "rawText" TEXT NOT NULL DEFAULT '',
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "BusinessMemorySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMemoryItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "confidence" INTEGER NOT NULL DEFAULT 70,
    "sourceType" TEXT NOT NULL DEFAULT '',
    "sourceName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "sourceId" TEXT,

    CONSTRAINT "BusinessMemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessMemorySource_businessId_idx" ON "BusinessMemorySource"("businessId");

-- CreateIndex
CREATE INDEX "BusinessMemorySource_businessId_sourceType_idx" ON "BusinessMemorySource"("businessId", "sourceType");

-- CreateIndex
CREATE INDEX "BusinessMemorySource_businessId_status_idx" ON "BusinessMemorySource"("businessId", "status");

-- CreateIndex
CREATE INDEX "BusinessMemoryItem_businessId_idx" ON "BusinessMemoryItem"("businessId");

-- CreateIndex
CREATE INDEX "BusinessMemoryItem_businessId_category_idx" ON "BusinessMemoryItem"("businessId", "category");

-- CreateIndex
CREATE INDEX "BusinessMemoryItem_businessId_status_idx" ON "BusinessMemoryItem"("businessId", "status");

-- CreateIndex
CREATE INDEX "BusinessMemoryItem_sourceId_idx" ON "BusinessMemoryItem"("sourceId");

-- AddForeignKey
ALTER TABLE "BusinessMemorySource" ADD CONSTRAINT "BusinessMemorySource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemoryItem" ADD CONSTRAINT "BusinessMemoryItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemoryItem" ADD CONSTRAINT "BusinessMemoryItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "BusinessMemorySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
