-- Connector receipts persist both successful and rejected upstream responses.
-- This keeps sync idempotent even when an application is rejected or later terminal.
CREATE TABLE "RecruitmentConnectorResponse" (
  "id" TEXT NOT NULL,
  "postingId" TEXT NOT NULL,
  "externalResponseId" TEXT NOT NULL,
  "applicationId" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentConnectorResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecruitmentConnectorResponse_postingId_externalResponseId_key"
ON "RecruitmentConnectorResponse"("postingId", "externalResponseId");
CREATE INDEX "RecruitmentConnectorResponse_applicationId_idx"
ON "RecruitmentConnectorResponse"("applicationId");

ALTER TABLE "RecruitmentConnectorResponse"
ADD CONSTRAINT "RecruitmentConnectorResponse_postingId_fkey"
FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentConnectorResponse"
ADD CONSTRAINT "RecruitmentConnectorResponse_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
