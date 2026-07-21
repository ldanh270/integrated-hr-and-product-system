-- Create RecruitmentOAuthAccount table
CREATE TABLE "recruitment_oauth_accounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "channel" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_oauth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recruitment_oauth_accounts_channel_key" ON "recruitment_oauth_accounts"("channel");
CREATE INDEX "recruitment_oauth_accounts_channel_idx" ON "recruitment_oauth_accounts"("channel");

-- Add oauthAccountId to JobPosting (table already exists)
ALTER TABLE "job_postings" ADD COLUMN "oauthAccountId" TEXT;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_oauthAccountId_fkey" FOREIGN KEY ("oauthAccountId") REFERENCES "recruitment_oauth_accounts"("id") ON DELETE SET NULL;
CREATE INDEX "job_postings_oauthAccountId_idx" ON "job_postings"("oauthAccountId");
