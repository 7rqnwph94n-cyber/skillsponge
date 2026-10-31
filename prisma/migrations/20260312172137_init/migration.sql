-- CreateEnum
CREATE TYPE "KnowledgeRecordType" AS ENUM ('PROCEDURE', 'FIELD_NOTE', 'FAILURE_PATTERN', 'LESSON_LEARNED', 'EXPERT_INTERVIEW', 'SHADOWING_RECORD');

-- CreateEnum
CREATE TYPE "ApprovalState" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN');

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRecord" (
    "id" TEXT NOT NULL,
    "type" "KnowledgeRecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "reviewer" TEXT,
    "approvalState" "ApprovalState" NOT NULL DEFAULT 'DRAFT',
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "asset" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "tags" TEXT[],
    "typePayload" JSONB,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRecordVersion" (
    "id" TEXT NOT NULL,
    "knowledgeRecordId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "editedBy" TEXT NOT NULL,
    "changeNote" TEXT,
    "changeReason" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRecordVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelation" (
    "id" TEXT NOT NULL,
    "fromRecordId" TEXT NOT NULL,
    "toRecordId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'RELATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "knowledgeRecordId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" "AppRole",
    "eventType" TEXT NOT NULL,
    "fromStatus" "ApprovalState",
    "toStatus" "ApprovalState",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_username_key" ON "AppUser"("username");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_approvalState_idx" ON "KnowledgeRecord"("approvalState");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_type_idx" ON "KnowledgeRecord"("type");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_asset_idx" ON "KnowledgeRecord"("asset");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_system_idx" ON "KnowledgeRecord"("system");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_task_idx" ON "KnowledgeRecord"("task");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_symptom_idx" ON "KnowledgeRecord"("symptom");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_createdAt_idx" ON "KnowledgeRecord"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeRecordVersion_knowledgeRecordId_createdAt_idx" ON "KnowledgeRecordVersion"("knowledgeRecordId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRecordVersion_knowledgeRecordId_versionNumber_key" ON "KnowledgeRecordVersion"("knowledgeRecordId", "versionNumber");

-- CreateIndex
CREATE INDEX "KnowledgeRelation_fromRecordId_idx" ON "KnowledgeRelation"("fromRecordId");

-- CreateIndex
CREATE INDEX "KnowledgeRelation_toRecordId_idx" ON "KnowledgeRelation"("toRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRelation_fromRecordId_toRecordId_relationType_key" ON "KnowledgeRelation"("fromRecordId", "toRecordId", "relationType");

-- CreateIndex
CREATE INDEX "AuditEvent_knowledgeRecordId_createdAt_idx" ON "AuditEvent"("knowledgeRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- AddForeignKey
ALTER TABLE "KnowledgeRecordVersion" ADD CONSTRAINT "KnowledgeRecordVersion_knowledgeRecordId_fkey" FOREIGN KEY ("knowledgeRecordId") REFERENCES "KnowledgeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelation" ADD CONSTRAINT "KnowledgeRelation_fromRecordId_fkey" FOREIGN KEY ("fromRecordId") REFERENCES "KnowledgeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelation" ADD CONSTRAINT "KnowledgeRelation_toRecordId_fkey" FOREIGN KEY ("toRecordId") REFERENCES "KnowledgeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_knowledgeRecordId_fkey" FOREIGN KEY ("knowledgeRecordId") REFERENCES "KnowledgeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
