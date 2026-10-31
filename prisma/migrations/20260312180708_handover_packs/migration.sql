-- CreateTable
CREATE TABLE "ExpertProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleFocus" TEXT NOT NULL,
    "domains" TEXT[],
    "assets" TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "retirementWindowStart" TIMESTAMP(3),
    "retirementWindowEnd" TIMESTAMP(3),
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverPack" (
    "id" TEXT NOT NULL,
    "expertProfileId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "targetDate" TIMESTAMP(3),
    "coverageScore" INTEGER NOT NULL DEFAULT 0,
    "validatedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverTask" (
    "id" TEXT NOT NULL,
    "handoverPackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigneeName" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpertProfile_riskLevel_idx" ON "ExpertProfile"("riskLevel");

-- CreateIndex
CREATE INDEX "ExpertProfile_retirementWindowEnd_idx" ON "ExpertProfile"("retirementWindowEnd");

-- CreateIndex
CREATE INDEX "HandoverPack_expertProfileId_idx" ON "HandoverPack"("expertProfileId");

-- CreateIndex
CREATE INDEX "HandoverPack_status_idx" ON "HandoverPack"("status");

-- CreateIndex
CREATE INDEX "HandoverPack_targetDate_idx" ON "HandoverPack"("targetDate");

-- CreateIndex
CREATE INDEX "HandoverTask_handoverPackId_idx" ON "HandoverTask"("handoverPackId");

-- CreateIndex
CREATE INDEX "HandoverTask_status_idx" ON "HandoverTask"("status");

-- AddForeignKey
ALTER TABLE "HandoverPack" ADD CONSTRAINT "HandoverPack_expertProfileId_fkey" FOREIGN KEY ("expertProfileId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverTask" ADD CONSTRAINT "HandoverTask_handoverPackId_fkey" FOREIGN KEY ("handoverPackId") REFERENCES "HandoverPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
