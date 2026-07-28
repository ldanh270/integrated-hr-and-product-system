CREATE TABLE "CandidateMeta" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "metaKey" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateMeta_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CandidateMeta"
  ADD CONSTRAINT "CandidateMeta_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CandidateMeta_candidateId_metaKey_key"
  ON "CandidateMeta"("candidateId", "metaKey");
CREATE INDEX "CandidateMeta_metaKey_idx" ON "CandidateMeta"("metaKey");
