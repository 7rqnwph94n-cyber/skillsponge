-- AlterTable
ALTER TABLE "KnowledgeRecord" ADD COLUMN     "handoverPackId" TEXT,
ADD COLUMN     "sourceExpertId" TEXT;

-- CreateIndex
CREATE INDEX "KnowledgeRecord_sourceExpertId_idx" ON "KnowledgeRecord"("sourceExpertId");

-- CreateIndex
CREATE INDEX "KnowledgeRecord_handoverPackId_idx" ON "KnowledgeRecord"("handoverPackId");

-- AddForeignKey
ALTER TABLE "KnowledgeRecord" ADD CONSTRAINT "KnowledgeRecord_sourceExpertId_fkey" FOREIGN KEY ("sourceExpertId") REFERENCES "ExpertProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRecord" ADD CONSTRAINT "KnowledgeRecord_handoverPackId_fkey" FOREIGN KEY ("handoverPackId") REFERENCES "HandoverPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
