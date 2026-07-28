-- Recruitment workspace ownership:
-- Requisition 1-N Posting; Posting 1-N Application and 1-N PipelineStage.

-- JobPosting originally belonged to JobDescription. Promote that relationship
-- to the requisition before this migration creates or queries postings by
-- requisitionId.
ALTER TABLE "JobPosting" ADD COLUMN "requisitionId" TEXT;

UPDATE "JobPosting" posting
SET "requisitionId" = description."requisitionId"
FROM "JobDescription" description
WHERE description."id" = posting."jobDescriptionId";

ALTER TABLE "JobPosting" ALTER COLUMN "requisitionId" SET NOT NULL;
ALTER TABLE "JobPosting" DROP CONSTRAINT IF EXISTS "JobPosting_jobDescriptionId_fkey";
DROP INDEX IF EXISTS "JobPosting_jobDescriptionId_idx";
ALTER TABLE "JobPosting" DROP COLUMN "jobDescriptionId";

-- Preserve historical applications that predate postings by grouping them in a
-- generated archived posting under their original requisition.
INSERT INTO "JobPosting" (
  "id", "requisitionId", "channel", "source", "sourceCode", "status",
  "connectorStatus", "createdAt", "updatedAt"
)
SELECT
  'legacy_posting_' || substr(md5(a."requisitionId"), 1, 16),
  a."requisitionId",
  'other',
  'other',
  'LEGACY_' || upper(substr(md5(a."requisitionId"), 1, 20)),
  'archived',
  'not_configured',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "RecruitmentApplication" a
WHERE a."postingId" IS NULL
GROUP BY a."requisitionId"
ON CONFLICT ("sourceCode") DO NOTHING;

UPDATE "RecruitmentApplication" a
SET "postingId" = p."id"
FROM "JobPosting" p
WHERE a."postingId" IS NULL
  AND p."requisitionId" = a."requisitionId"
  AND p."sourceCode" = 'LEGACY_' || upper(substr(md5(a."requisitionId"), 1, 20));

-- Upgrade generated names, then make the full recommended template available
-- on every posting without removing custom stages.
UPDATE "RecruitmentPipelineStage" current_stage
SET "name" = 'Nộp CV'
WHERE current_stage."name" IN ('Mới', 'Nộp đơn')
  AND NOT EXISTS (
    SELECT 1 FROM "RecruitmentPipelineStage" existing
    WHERE existing."postingId" = current_stage."postingId"
      AND existing."name" = 'Nộp CV'
  );

WITH template("name", "color", "ordinal", "isCompleted") AS (
  VALUES
    ('Nộp CV', '#3B82F6', 1, false),
    ('Phỏng vấn vòng 1', '#F59E0B', 2, false),
    ('Phỏng vấn vòng 2', '#8B5CF6', 3, false),
    ('Đang offer', '#EC4899', 4, false),
    ('Đã nhận', '#10B981', 5, true),
    ('Đã từ chối', '#EF4444', 6, true)
), posting_max AS (
  SELECT p."id" AS "postingId", COALESCE(MAX(s."position"), -1) AS "maxPosition"
  FROM "JobPosting" p
  LEFT JOIN "RecruitmentPipelineStage" s ON s."postingId" = p."id"
  GROUP BY p."id"
)
INSERT INTO "RecruitmentPipelineStage" (
  "id", "postingId", "name", "color", "position", "isDefault",
  "isCompleted", "createdAt", "updatedAt"
)
SELECT
  'stage_' || substr(md5(pm."postingId" || template."name"), 1, 20),
  pm."postingId",
  template."name",
  template."color",
  pm."maxPosition" + template."ordinal",
  false,
  template."isCompleted",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM posting_max pm
CROSS JOIN template
WHERE NOT EXISTS (
  SELECT 1 FROM "RecruitmentPipelineStage" existing
  WHERE existing."postingId" = pm."postingId"
    AND existing."name" = template."name"
);

-- Exactly one default stage per posting. Prefer the existing default, then the
-- recommended first stage, then the first custom stage.
WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "postingId"
      ORDER BY "isDefault" DESC, CASE WHEN "name" = 'Nộp CV' THEN 0 ELSE 1 END, "position", "createdAt", "id"
    ) AS priority
  FROM "RecruitmentPipelineStage"
)
UPDATE "RecruitmentPipelineStage" stage
SET "isDefault" = (ranked.priority = 1)
FROM ranked
WHERE ranked."id" = stage."id";

-- Normalize positions after template insertion while preserving custom stage
-- relative order and putting the recommended template first.
UPDATE "RecruitmentPipelineStage"
SET "position" = -1000000 - "position";

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "postingId"
      ORDER BY
        CASE "name"
          WHEN 'Nộp CV' THEN 0
          WHEN 'Phỏng vấn vòng 1' THEN 1
          WHEN 'Phỏng vấn vòng 2' THEN 2
          WHEN 'Đang offer' THEN 3
          WHEN 'Đã nhận' THEN 4
          WHEN 'Đã từ chối' THEN 5
          ELSE 100
        END,
        "position" DESC,
        "createdAt",
        "id"
    ) - 1 AS new_position
  FROM "RecruitmentPipelineStage"
)
UPDATE "RecruitmentPipelineStage" stage
SET "position" = ranked.new_position
FROM ranked
WHERE ranked."id" = stage."id";

-- Posting owns requisition identity; repair any legacy mismatch before adding
-- composite ownership constraints.
UPDATE "RecruitmentApplication" application
SET "requisitionId" = posting."requisitionId"
FROM "JobPosting" posting
WHERE posting."id" = application."postingId"
  AND application."requisitionId" <> posting."requisitionId";

UPDATE "RecruitmentApplication" application
SET "pipelineStageId" = default_stage."id"
FROM "RecruitmentPipelineStage" default_stage
WHERE default_stage."postingId" = application."postingId"
  AND default_stage."isDefault" = true
  AND (
    application."pipelineStageId" IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM "RecruitmentPipelineStage" current_stage
      WHERE current_stage."id" = application."pipelineStageId"
        AND current_stage."postingId" = application."postingId"
    )
  );

ALTER TABLE "RecruitmentApplication" ALTER COLUMN "postingId" SET NOT NULL;
ALTER TABLE "RecruitmentApplication" ALTER COLUMN "pipelineStageId" SET NOT NULL;

ALTER TABLE "JobPosting" DROP CONSTRAINT IF EXISTS "JobPosting_requisitionId_fkey";
ALTER TABLE "RecruitmentApplication" DROP CONSTRAINT IF EXISTS "RecruitmentApplication_requisitionId_fkey";
ALTER TABLE "RecruitmentApplication" DROP CONSTRAINT IF EXISTS "RecruitmentApplication_candidateId_fkey";
ALTER TABLE "RecruitmentApplication" DROP CONSTRAINT IF EXISTS "RecruitmentApplication_pipelineStageId_fkey";

ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_requisitionId_fkey"
  FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_requisitionId_fkey"
  FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_pipelineStageId_fkey"
  FOREIGN KEY ("pipelineStageId") REFERENCES "RecruitmentPipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "JobPosting_id_requisitionId_key" ON "JobPosting"("id", "requisitionId");
CREATE UNIQUE INDEX "RecruitmentPipelineStage_id_postingId_key" ON "RecruitmentPipelineStage"("id", "postingId");
CREATE UNIQUE INDEX "RecruitmentPipelineStage_one_default_per_posting_key"
  ON "RecruitmentPipelineStage"("postingId") WHERE "isDefault" = true;
CREATE INDEX "RecruitmentApplication_postingId_pipelineStageId_idx"
  ON "RecruitmentApplication"("postingId", "pipelineStageId");
CREATE INDEX "RecruitmentApplication_postingId_createdAt_idx"
  ON "RecruitmentApplication"("postingId", "createdAt");

-- One external response produces at most one application, and one application
-- can be the result of at most one connector response.
WITH duplicated_links AS (
  SELECT
    "id",
    row_number() OVER (PARTITION BY "applicationId" ORDER BY "processedAt", "id") AS duplicate_order
  FROM "RecruitmentConnectorResponse"
  WHERE "applicationId" IS NOT NULL
)
UPDATE "RecruitmentConnectorResponse" response
SET
  "applicationId" = NULL,
  "errorCode" = COALESCE(response."errorCode", 'DUPLICATE_APPLICATION_LINK'),
  "errorMessage" = COALESCE(response."errorMessage", 'Response link duplicated during workspace migration')
FROM duplicated_links
WHERE duplicated_links."id" = response."id"
  AND duplicated_links.duplicate_order > 1;

DROP INDEX IF EXISTS "RecruitmentConnectorResponse_applicationId_idx";
CREATE UNIQUE INDEX "RecruitmentConnectorResponse_applicationId_key"
  ON "RecruitmentConnectorResponse"("applicationId");

ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_posting_requisition_fkey"
  FOREIGN KEY ("postingId", "requisitionId") REFERENCES "JobPosting"("id", "requisitionId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_stage_posting_fkey"
  FOREIGN KEY ("pipelineStageId", "postingId") REFERENCES "RecruitmentPipelineStage"("id", "postingId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentPipelineStage" ADD CONSTRAINT "RecruitmentPipelineStage_position_check"
  CHECK ("position" >= 0);
