-- CreateEnum
CREATE TYPE "JobLogStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'CLOSED');

-- CreateEnum
CREATE TYPE "JobLogEntryType" AS ENUM ('NOTE', 'VOICE_TRANSCRIPTION', 'OBSERVATION', 'ACTION_TAKEN', 'ISSUE_FOUND');

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "jobReference" TEXT NOT NULL,
    "status" "JobLogStatus" NOT NULL DEFAULT 'OPEN',
    "customerName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteAddress" TEXT,
    "siteContactName" TEXT NOT NULL,
    "siteContactPhone" TEXT,
    "siteContactEmail" TEXT,
    "asset" TEXT NOT NULL,
    "assetSerial" TEXT,
    "assetLocation" TEXT,
    "technicianId" TEXT NOT NULL,
    "technicianName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerName" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLogEntry" (
    "id" TEXT NOT NULL,
    "jobLogId" TEXT NOT NULL,
    "entryType" "JobLogEntryType" NOT NULL DEFAULT 'NOTE',
    "content" TEXT NOT NULL,
    "isVoiceInput" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLogPhoto" (
    "id" TEXT NOT NULL,
    "jobLogId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLogPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLogAuditEvent" (
    "id" TEXT NOT NULL,
    "jobLogId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" "AppRole",
    "eventType" TEXT NOT NULL,
    "fromStatus" "JobLogStatus",
    "toStatus" "JobLogStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLogAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobLog_codeHash_key" ON "JobLog"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "JobLog_jobReference_key" ON "JobLog"("jobReference");

-- CreateIndex
CREATE INDEX "JobLog_status_idx" ON "JobLog"("status");

-- CreateIndex
CREATE INDEX "JobLog_technicianId_idx" ON "JobLog"("technicianId");

-- CreateIndex
CREATE INDEX "JobLog_asset_idx" ON "JobLog"("asset");

-- CreateIndex
CREATE INDEX "JobLog_customerName_idx" ON "JobLog"("customerName");

-- CreateIndex
CREATE INDEX "JobLog_createdAt_idx" ON "JobLog"("createdAt");

-- CreateIndex
CREATE INDEX "JobLogEntry_jobLogId_createdAt_idx" ON "JobLogEntry"("jobLogId", "createdAt");

-- CreateIndex
CREATE INDEX "JobLogPhoto_jobLogId_idx" ON "JobLogPhoto"("jobLogId");

-- CreateIndex
CREATE INDEX "JobLogAuditEvent_jobLogId_createdAt_idx" ON "JobLogAuditEvent"("jobLogId", "createdAt");

-- CreateIndex
CREATE INDEX "JobLogAuditEvent_eventType_idx" ON "JobLogAuditEvent"("eventType");

-- AddForeignKey
ALTER TABLE "JobLog" ADD CONSTRAINT "JobLog_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLogEntry" ADD CONSTRAINT "JobLogEntry_jobLogId_fkey" FOREIGN KEY ("jobLogId") REFERENCES "JobLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLogPhoto" ADD CONSTRAINT "JobLogPhoto_jobLogId_fkey" FOREIGN KEY ("jobLogId") REFERENCES "JobLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLogAuditEvent" ADD CONSTRAINT "JobLogAuditEvent_jobLogId_fkey" FOREIGN KEY ("jobLogId") REFERENCES "JobLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
