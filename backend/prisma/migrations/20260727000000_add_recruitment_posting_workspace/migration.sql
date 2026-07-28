ALTER TABLE "JobPosting"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "archivedById" TEXT;

ALTER TABLE "JobPosting"
  ADD CONSTRAINT "JobPosting_archivedById_fkey"
  FOREIGN KEY ("archivedById") REFERENCES "Employee"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "JobPosting_archivedById_idx" ON "JobPosting"("archivedById");

CREATE TABLE "RecruitmentPostingActivity" (
  "id" TEXT NOT NULL,
  "postingId" TEXT NOT NULL,
  "applicationId" TEXT,
  "actorId" TEXT,
  "type" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentPostingActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RecruitmentPostingActivity"
  ADD CONSTRAINT "RecruitmentPostingActivity_postingId_fkey"
  FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RecruitmentPostingActivity_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "RecruitmentPostingActivity_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "Employee"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "RecruitmentPostingActivity_postingId_createdAt_idx"
  ON "RecruitmentPostingActivity"("postingId", "createdAt");
CREATE INDEX "RecruitmentPostingActivity_applicationId_idx"
  ON "RecruitmentPostingActivity"("applicationId");
CREATE INDEX "RecruitmentPostingActivity_actorId_idx"
  ON "RecruitmentPostingActivity"("actorId");
CREATE INDEX "RecruitmentPostingActivity_type_idx"
  ON "RecruitmentPostingActivity"("type");
