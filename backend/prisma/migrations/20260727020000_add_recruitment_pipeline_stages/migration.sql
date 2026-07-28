CREATE TABLE "RecruitmentPipelineStage" (
  "id" TEXT NOT NULL, "postingId" TEXT NOT NULL, "name" TEXT NOT NULL, "color" TEXT NOT NULL,
  "position" INTEGER NOT NULL, "isDefault" BOOLEAN NOT NULL DEFAULT false, "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecruitmentPipelineStage_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "RecruitmentPipelineStage" ADD CONSTRAINT "RecruitmentPipelineStage_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "RecruitmentPipelineStage_postingId_position_key" ON "RecruitmentPipelineStage"("postingId", "position");
CREATE INDEX "RecruitmentPipelineStage_postingId_idx" ON "RecruitmentPipelineStage"("postingId");
INSERT INTO "RecruitmentPipelineStage" ("id", "postingId", "name", "color", "position", "isDefault", "isCompleted", "updatedAt")
SELECT 'stage_' || substr(md5("id"), 1, 20), "id", 'Mới', '#3B82F6', 0, true, false, CURRENT_TIMESTAMP FROM "JobPosting";
ALTER TABLE "RecruitmentApplication" ADD COLUMN "pipelineStageId" TEXT;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "RecruitmentPipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "RecruitmentApplication_pipelineStageId_idx" ON "RecruitmentApplication"("pipelineStageId");
UPDATE "RecruitmentApplication" a SET "pipelineStageId" = s."id" FROM "RecruitmentPipelineStage" s WHERE s."postingId" = a."postingId" AND s."isDefault" = true;
