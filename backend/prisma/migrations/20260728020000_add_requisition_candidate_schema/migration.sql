CREATE TYPE "RecruitmentFieldType" AS ENUM ('short_text', 'paragraph');

CREATE TABLE "CandidateFieldDefinition" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RecruitmentFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CandidateFieldDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PostingFieldSnapshot" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RecruitmentFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "externalQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostingFieldSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateFieldDefinition_requisitionId_key_key" ON "CandidateFieldDefinition"("requisitionId", "key");
CREATE UNIQUE INDEX "CandidateFieldDefinition_requisitionId_position_key" ON "CandidateFieldDefinition"("requisitionId", "position");
CREATE INDEX "CandidateFieldDefinition_requisitionId_idx" ON "CandidateFieldDefinition"("requisitionId");
CREATE UNIQUE INDEX "PostingFieldSnapshot_postingId_fieldKey_key" ON "PostingFieldSnapshot"("postingId", "fieldKey");
CREATE UNIQUE INDEX "PostingFieldSnapshot_postingId_position_key" ON "PostingFieldSnapshot"("postingId", "position");
CREATE INDEX "PostingFieldSnapshot_postingId_idx" ON "PostingFieldSnapshot"("postingId");
CREATE INDEX "PostingFieldSnapshot_externalQuestionId_idx" ON "PostingFieldSnapshot"("externalQuestionId");

ALTER TABLE "CandidateFieldDefinition"
ADD CONSTRAINT "CandidateFieldDefinition_requisitionId_fkey"
FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostingFieldSnapshot"
ADD CONSTRAINT "PostingFieldSnapshot_postingId_fkey"
FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH latest_posting_schema AS (
  SELECT DISTINCT ON (p."requisitionId")
    p."requisitionId",
    p."formFields"
  FROM "JobPosting" p
  WHERE jsonb_typeof(p."formFields") = 'array'
  ORDER BY p."requisitionId", p."createdAt" DESC
)
INSERT INTO "CandidateFieldDefinition"
  ("id", "requisitionId", "key", "label", "type", "required", "position", "createdAt", "updatedAt")
SELECT
  'cfd_' || md5(schema."requisitionId" || field.value->>'key'),
  schema."requisitionId",
  field.value->>'key',
  field.value->>'label',
  CASE WHEN field.value->>'type' = 'paragraph' THEN 'paragraph'::"RecruitmentFieldType" ELSE 'short_text'::"RecruitmentFieldType" END,
  COALESCE((field.value->>'required')::boolean, false),
  field.ordinality - 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM latest_posting_schema schema
CROSS JOIN LATERAL jsonb_array_elements(schema."formFields") WITH ORDINALITY AS field(value, ordinality);

INSERT INTO "CandidateFieldDefinition"
  ("id", "requisitionId", "key", "label", "type", "required", "position", "createdAt", "updatedAt")
SELECT
  'cfd_' || md5(r."id" || defaults.key),
  r."id",
  defaults.key,
  defaults.label,
  defaults.type::"RecruitmentFieldType",
  defaults.required,
  defaults.position,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "JobRequisition" r
CROSS JOIN (VALUES
  ('full_name', 'Họ và tên', 'short_text', true, 0),
  ('email', 'Email', 'short_text', true, 1),
  ('phone', 'Số điện thoại', 'short_text', false, 2),
  ('cv_url', 'Đường dẫn CV', 'short_text', false, 3),
  ('notes', 'Thông tin bổ sung', 'paragraph', false, 4)
) AS defaults(key, label, type, required, position)
WHERE NOT EXISTS (
  SELECT 1 FROM "CandidateFieldDefinition" existing WHERE existing."requisitionId" = r."id"
);

INSERT INTO "PostingFieldSnapshot"
  ("id", "postingId", "fieldKey", "label", "type", "required", "position", "createdAt", "updatedAt")
SELECT
  'pfs_' || md5(p."id" || field.value->>'key'),
  p."id",
  field.value->>'key',
  field.value->>'label',
  CASE WHEN field.value->>'type' = 'paragraph' THEN 'paragraph'::"RecruitmentFieldType" ELSE 'short_text'::"RecruitmentFieldType" END,
  COALESCE((field.value->>'required')::boolean, false),
  field.ordinality - 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "JobPosting" p
CROSS JOIN LATERAL jsonb_array_elements(p."formFields") WITH ORDINALITY AS field(value, ordinality)
WHERE jsonb_typeof(p."formFields") = 'array';

