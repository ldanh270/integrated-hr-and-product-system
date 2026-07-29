-- Canonical application position is RecruitmentApplication.pipelineStageId.
-- `status` remains lifecycle compatibility data and must never select a Kanban column.
ALTER TABLE "RecruitmentApplication"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Requisition-owned stages are required for every application stage. Backfill
-- legacy posting-owned stages before enforcing the relationship in a trigger.
UPDATE "RecruitmentPipelineStage" AS stage
SET "requisitionId" = posting."requisitionId"
FROM "JobPosting" AS posting
WHERE stage."postingId" = posting.id
  AND stage."requisitionId" IS NULL;

UPDATE "RecruitmentPipelineStage" AS stage
SET "requisitionId" = application."requisitionId"
FROM (
  SELECT "pipelineStageId", MIN("requisitionId") AS "requisitionId"
  FROM "RecruitmentApplication"
  GROUP BY "pipelineStageId"
) AS application
WHERE stage.id = application."pipelineStageId"
  AND stage."requisitionId" IS NULL;

CREATE OR REPLACE FUNCTION "assertRecruitmentApplicationOwnership"()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "RecruitmentPipelineStage"
    WHERE id = NEW."pipelineStageId"
      AND "requisitionId" = NEW."requisitionId"
  ) THEN
    RAISE EXCEPTION 'Recruitment application pipeline stage must belong to its requisition';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "JobPosting"
    WHERE id = NEW."postingId"
      AND "requisitionId" = NEW."requisitionId"
  ) THEN
    RAISE EXCEPTION 'Recruitment application posting must belong to its requisition';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "RecruitmentApplication_ownership_trigger"
BEFORE INSERT OR UPDATE OF "requisitionId", "postingId", "pipelineStageId"
ON "RecruitmentApplication"
FOR EACH ROW EXECUTE FUNCTION "assertRecruitmentApplicationOwnership"();

-- A candidate may have one non-terminal application per requisition. Terminal
-- applications remain history and can be followed by an explicit reapplication.
CREATE UNIQUE INDEX "RecruitmentApplication_active_candidate_requisition_key"
  ON "RecruitmentApplication"("candidateId", "requisitionId")
  WHERE status NOT IN ('hired', 'rejected', 'offer_declined', 'offer_rescinded', 'candidate_withdrew');

ALTER TABLE "JobRequisition"
  ADD CONSTRAINT "JobRequisition_headcount_positive_check" CHECK ("headcount" > 0),
  ADD CONSTRAINT "JobRequisition_filled_count_bounds_check" CHECK ("filledCount" >= 0 AND "filledCount" <= "headcount");
