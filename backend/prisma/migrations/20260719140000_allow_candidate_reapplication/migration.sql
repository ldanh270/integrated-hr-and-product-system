DROP INDEX IF EXISTS "RecruitmentApplication_requisitionId_candidateId_key";

CREATE INDEX "RecruitmentApplication_requisitionId_candidateId_idx"
  ON "RecruitmentApplication"("requisitionId", "candidateId");

CREATE UNIQUE INDEX "RecruitmentApplication_one_active_per_requisition_candidate_key"
  ON "RecruitmentApplication"("requisitionId", "candidateId")
  WHERE "status" NOT IN ('hired', 'rejected', 'offer_declined', 'offer_rescinded', 'candidate_withdrew');
