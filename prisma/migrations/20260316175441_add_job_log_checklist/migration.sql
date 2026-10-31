-- CreateTable
CREATE TABLE "JobLogChecklist" (
    "id" TEXT NOT NULL,
    "jobLogId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "procedureTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLogChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLogChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLogChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobLogChecklist_jobLogId_idx" ON "JobLogChecklist"("jobLogId");

-- CreateIndex
CREATE INDEX "JobLogChecklistItem_checklistId_idx" ON "JobLogChecklistItem"("checklistId");

-- AddForeignKey
ALTER TABLE "JobLogChecklist" ADD CONSTRAINT "JobLogChecklist_jobLogId_fkey" FOREIGN KEY ("jobLogId") REFERENCES "JobLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLogChecklistItem" ADD CONSTRAINT "JobLogChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "JobLogChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
