CREATE TABLE "InternalWorker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SPECIALIST',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalWorker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalTaskAssignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'CLIENT_SETUP',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT NOT NULL DEFAULT '',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "workerId" TEXT,

    CONSTRAINT "InternalTaskAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalClientNote" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "authorEmail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "workerId" TEXT,

    CONSTRAINT "InternalClientNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsJobRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "details" TEXT NOT NULL DEFAULT '',
    "error" TEXT NOT NULL DEFAULT '',
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT,

    CONSTRAINT "OpsJobRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InternalWorker_email_key" ON "InternalWorker"("email");
CREATE INDEX "InternalWorker_status_idx" ON "InternalWorker"("status");
CREATE INDEX "InternalTaskAssignment_businessId_idx" ON "InternalTaskAssignment"("businessId");
CREATE INDEX "InternalTaskAssignment_workerId_idx" ON "InternalTaskAssignment"("workerId");
CREATE INDEX "InternalTaskAssignment_status_idx" ON "InternalTaskAssignment"("status");
CREATE INDEX "InternalTaskAssignment_dueAt_idx" ON "InternalTaskAssignment"("dueAt");
CREATE INDEX "InternalClientNote_businessId_idx" ON "InternalClientNote"("businessId");
CREATE INDEX "InternalClientNote_workerId_idx" ON "InternalClientNote"("workerId");
CREATE INDEX "InternalClientNote_createdAt_idx" ON "InternalClientNote"("createdAt");
CREATE INDEX "OpsJobRun_businessId_idx" ON "OpsJobRun"("businessId");
CREATE INDEX "OpsJobRun_status_idx" ON "OpsJobRun"("status");
CREATE INDEX "OpsJobRun_kind_idx" ON "OpsJobRun"("kind");
CREATE INDEX "OpsJobRun_scheduledFor_idx" ON "OpsJobRun"("scheduledFor");

ALTER TABLE "InternalTaskAssignment" ADD CONSTRAINT "InternalTaskAssignment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalTaskAssignment" ADD CONSTRAINT "InternalTaskAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "InternalWorker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalClientNote" ADD CONSTRAINT "InternalClientNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalClientNote" ADD CONSTRAINT "InternalClientNote_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "InternalWorker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsJobRun" ADD CONSTRAINT "OpsJobRun_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
