-- CreateEnum
CREATE TYPE "ProcedureScope" AS ENUM ('GENERIC', 'MODEL_SPECIFIC', 'VARIANT_SPECIFIC');

-- AlterTable
ALTER TABLE "KnowledgeRecord" ADD COLUMN     "scope" "ProcedureScope";

-- CreateIndex
CREATE INDEX "KnowledgeRecord_scope_idx" ON "KnowledgeRecord"("scope");
