-- Add requisition ownership without deleting legacy posting ownership.
-- The application service backfills and normalizes existing stages lazily per requisition.
ALTER TABLE "RecruitmentPipelineStage" ADD COLUMN "requisitionId" TEXT;
ALTER TABLE "RecruitmentPipelineStage" ALTER COLUMN "postingId" DROP NOT NULL;

CREATE INDEX "RecruitmentPipelineStage_requisitionId_position_idx"
  ON "RecruitmentPipelineStage"("requisitionId", "position");

ALTER TABLE "RecruitmentPipelineStage"
  ADD CONSTRAINT "RecruitmentPipelineStage_requisitionId_fkey"
  FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
