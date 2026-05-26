-- CreateTable
CREATE TABLE "MissedCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callerName" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repliedAt" DATETIME,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "MissedCall_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MissedCall_businessId_idx" ON "MissedCall"("businessId");
