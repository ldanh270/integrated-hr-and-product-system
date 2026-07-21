-- Create RecruitmentOAuthAccount table
CREATE TABLE "RecruitmentOAuthAccount" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "channel" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentOAuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecruitmentOAuthAccount_channel_key" ON "RecruitmentOAuthAccount"("channel");
CREATE INDEX "RecruitmentOAuthAccount_channel_idx" ON "RecruitmentOAuthAccount"("channel");

-- Add oauthAccountId to JobPosting (table already exists)
ALTER TABLE "JobPosting" ADD COLUMN "oauthAccountId" TEXT;
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_oauthAccountId_fkey" FOREIGN KEY ("oauthAccountId") REFERENCES "RecruitmentOAuthAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "JobPosting_oauthAccountId_idx" ON "JobPosting"("oauthAccountId");
