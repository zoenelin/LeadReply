CREATE TABLE "ReviewProviderConnection" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GOOGLE_BUSINESS_PROFILE',
    "status" TEXT NOT NULL DEFAULT 'ACTION_REQUIRED',
    "accountId" TEXT NOT NULL DEFAULT '',
    "locationId" TEXT NOT NULL DEFAULT '',
    "locationName" TEXT NOT NULL DEFAULT '',
    "accessTokenEncrypted" TEXT NOT NULL DEFAULT '',
    "refreshTokenEncrypted" TEXT NOT NULL DEFAULT '',
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "ReviewProviderConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalReview" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GOOGLE_BUSINESS_PROFILE',
    "providerReviewId" TEXT NOT NULL,
    "providerReviewName" TEXT NOT NULL DEFAULT '',
    "reviewerName" TEXT NOT NULL DEFAULT '',
    "reviewerProfilePhotoUrl" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT NOT NULL DEFAULT '',
    "reviewUrl" TEXT NOT NULL DEFAULT '',
    "reviewCreatedAt" TIMESTAMP(3),
    "reviewUpdatedAt" TIMESTAMP(3),
    "matchedConfidence" INTEGER NOT NULL DEFAULT 0,
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "connectionId" TEXT,
    "reviewRequestId" TEXT,

    CONSTRAINT "ExternalReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewSyncRun" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GOOGLE_BUSINESS_PROFILE',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "reviewsFetched" INTEGER NOT NULL DEFAULT 0,
    "reviewsMatched" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT NOT NULL DEFAULT '',
    "rawSummary" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "connectionId" TEXT,

    CONSTRAINT "ReviewSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewProviderConnection_businessId_provider_key" ON "ReviewProviderConnection"("businessId", "provider");
CREATE INDEX "ReviewProviderConnection_businessId_idx" ON "ReviewProviderConnection"("businessId");
CREATE INDEX "ReviewProviderConnection_provider_idx" ON "ReviewProviderConnection"("provider");
CREATE INDEX "ReviewProviderConnection_status_idx" ON "ReviewProviderConnection"("status");

CREATE UNIQUE INDEX "ExternalReview_provider_providerReviewId_key" ON "ExternalReview"("provider", "providerReviewId");
CREATE UNIQUE INDEX "ExternalReview_reviewRequestId_key" ON "ExternalReview"("reviewRequestId");
CREATE INDEX "ExternalReview_businessId_idx" ON "ExternalReview"("businessId");
CREATE INDEX "ExternalReview_connectionId_idx" ON "ExternalReview"("connectionId");
CREATE INDEX "ExternalReview_reviewRequestId_idx" ON "ExternalReview"("reviewRequestId");
CREATE INDEX "ExternalReview_reviewCreatedAt_idx" ON "ExternalReview"("reviewCreatedAt");

CREATE INDEX "ReviewSyncRun_businessId_idx" ON "ReviewSyncRun"("businessId");
CREATE INDEX "ReviewSyncRun_connectionId_idx" ON "ReviewSyncRun"("connectionId");
CREATE INDEX "ReviewSyncRun_provider_idx" ON "ReviewSyncRun"("provider");
CREATE INDEX "ReviewSyncRun_status_idx" ON "ReviewSyncRun"("status");
CREATE INDEX "ReviewSyncRun_startedAt_idx" ON "ReviewSyncRun"("startedAt");

ALTER TABLE "ReviewProviderConnection" ADD CONSTRAINT "ReviewProviderConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalReview" ADD CONSTRAINT "ExternalReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalReview" ADD CONSTRAINT "ExternalReview_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ReviewProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalReview" ADD CONSTRAINT "ExternalReview_reviewRequestId_fkey" FOREIGN KEY ("reviewRequestId") REFERENCES "ReviewRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewSyncRun" ADD CONSTRAINT "ReviewSyncRun_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewSyncRun" ADD CONSTRAINT "ReviewSyncRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ReviewProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
