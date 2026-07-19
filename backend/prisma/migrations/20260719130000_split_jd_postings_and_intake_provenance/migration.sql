-- Split reusable JD content from channel-specific publication records.
-- Existing JD publication metadata is preserved as one legacy JobPosting.

CREATE TYPE "RecruitmentChannel" AS ENUM (
  'linkedin', 'facebook', 'google_form', 'company_website', 'agency', 'referral', 'other'
);
CREATE TYPE "ConnectorStatus" AS ENUM ('not_configured', 'ready', 'error');

CREATE TABLE "JobPosting" (
  "id" TEXT NOT NULL,
  "jobDescriptionId" TEXT NOT NULL,
  "channel" "RecruitmentChannel" NOT NULL,
  "source" "RecruitmentSource" NOT NULL,
  "sourceCode" TEXT NOT NULL,
  "status" "PostingStatus" NOT NULL DEFAULT 'draft',
  "postingUrl" TEXT,
  "externalId" TEXT,
  "connectorStatus" "ConnectorStatus" NOT NULL DEFAULT 'not_configured',
  "publishedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "JobPosting" (
  "id", "jobDescriptionId", "channel", "source", "sourceCode", "status", "postingUrl",
  "publishedAt", "closedAt", "createdAt", "updatedAt"
)
SELECT
  'legacy_' || md5("id"),
  "id",
  CASE lower("channel")
    WHEN 'linkedin' THEN 'linkedin'::"RecruitmentChannel"
    WHEN 'facebook' THEN 'facebook'::"RecruitmentChannel"
    WHEN 'google_form' THEN 'google_form'::"RecruitmentChannel"
    WHEN 'company_website' THEN 'company_website'::"RecruitmentChannel"
    WHEN 'website' THEN 'company_website'::"RecruitmentChannel"
    WHEN 'agency' THEN 'agency'::"RecruitmentChannel"
    WHEN 'recruitment_agency' THEN 'agency'::"RecruitmentChannel"
    WHEN 'referral' THEN 'referral'::"RecruitmentChannel"
    ELSE 'other'::"RecruitmentChannel"
  END,
  CASE lower("channel")
    WHEN 'linkedin' THEN 'linkedin'::"RecruitmentSource"
    WHEN 'facebook' THEN 'facebook'::"RecruitmentSource"
    WHEN 'google_form' THEN 'google_form'::"RecruitmentSource"
    WHEN 'website' THEN 'company_website'::"RecruitmentSource"
    WHEN 'company_website' THEN 'company_website'::"RecruitmentSource"
    WHEN 'agency' THEN 'agency'::"RecruitmentSource"
    WHEN 'recruitment_agency' THEN 'recruitment_agency'::"RecruitmentSource"
    WHEN 'referral' THEN 'referral'::"RecruitmentSource"
    ELSE 'other'::"RecruitmentSource"
  END,
  'LEGACY-' || upper(substr(md5("id"), 1, 12)),
  "postingStatus", "postingUrl", "postedAt", "closedAt", "createdAt", "updatedAt"
FROM "JobDescription";

ALTER TABLE "RecruitmentApplication"
  ADD COLUMN "jobDescriptionId" TEXT,
  ADD COLUMN "postingId" TEXT,
  ADD COLUMN "sourceRef" TEXT;

-- Historical rows get the earliest JD of their requisition. A posting is not
-- inferred because the original schema did not retain trustworthy provenance.
UPDATE "RecruitmentApplication" application
SET "jobDescriptionId" = (
  SELECT jd."id"
  FROM "JobDescription" jd
  WHERE jd."requisitionId" = application."requisitionId"
  ORDER BY jd."createdAt" ASC
  LIMIT 1
);

ALTER TABLE "JobDescription"
  DROP COLUMN "channel",
  DROP COLUMN "postingUrl",
  DROP COLUMN "postingStatus",
  DROP COLUMN "postedAt",
  DROP COLUMN "closedAt";

CREATE INDEX "JobPosting_jobDescriptionId_idx" ON "JobPosting"("jobDescriptionId");
CREATE INDEX "JobPosting_channel_idx" ON "JobPosting"("channel");
CREATE UNIQUE INDEX "JobPosting_sourceCode_key" ON "JobPosting"("sourceCode");
CREATE INDEX "JobPosting_source_idx" ON "JobPosting"("source");
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");
CREATE INDEX "RecruitmentApplication_jobDescriptionId_idx" ON "RecruitmentApplication"("jobDescriptionId");
CREATE INDEX "RecruitmentApplication_postingId_idx" ON "RecruitmentApplication"("postingId");

ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_jobDescriptionId_fkey"
  FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_jobDescriptionId_fkey"
  FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_postingId_fkey"
  FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
