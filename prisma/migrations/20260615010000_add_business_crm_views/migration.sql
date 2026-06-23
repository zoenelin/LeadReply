-- CreateTable
CREATE TABLE "BusinessCrmView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "viewKey" TEXT NOT NULL DEFAULT '',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "visibleColumns" JSONB NOT NULL DEFAULT '[]',
    "sortKey" TEXT NOT NULL DEFAULT 'NEWEST',
    "sortDirection" TEXT NOT NULL DEFAULT 'DESC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "BusinessCrmView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessCrmView_businessId_idx" ON "BusinessCrmView"("businessId");

-- CreateIndex
CREATE INDEX "BusinessCrmView_createdByUserId_idx" ON "BusinessCrmView"("createdByUserId");

-- AddForeignKey
ALTER TABLE "BusinessCrmView" ADD CONSTRAINT "BusinessCrmView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCrmView" ADD CONSTRAINT "BusinessCrmView_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
