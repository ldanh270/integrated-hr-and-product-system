-- Migration: Add userId to RecruitmentOAuthAccount (per-user OAuth accounts)
-- This allows multiple users to have their own OAuth credentials for each channel

-- 1. Add userId column (nullable first to avoid breaking existing data)
ALTER TABLE "RecruitmentOAuthAccount" ADD COLUMN "userId" TEXT;

-- 2. Create temporary unique constraint
ALTER TABLE "RecruitmentOAuthAccount" DROP CONSTRAINT IF EXISTS "RecruitmentOAuthAccount_channel_key";

-- 3. Delete existing rows (this is a new feature, clean slate)
DELETE FROM "RecruitmentOAuthAccount";

-- 4. Add foreign key to Employee
ALTER TABLE "RecruitmentOAuthAccount" ADD CONSTRAINT "RecruitmentOAuthAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Employee"("id") ON DELETE CASCADE;

-- 5. Make userId NOT NULL
ALTER TABLE "RecruitmentOAuthAccount" ALTER COLUMN "userId" SET NOT NULL;

-- 6. Create unique constraint for userId + channel
ALTER TABLE "RecruitmentOAuthAccount" ADD CONSTRAINT "RecruitmentOAuthAccount_userId_channel_key"
  UNIQUE ("userId", "channel");

-- 7. Add back indexes
CREATE INDEX IF NOT EXISTS "RecruitmentOAuthAccount_userId_idx" ON "RecruitmentOAuthAccount"("userId");
CREATE INDEX IF NOT EXISTS "RecruitmentOAuthAccount_channel_idx" ON "RecruitmentOAuthAccount"("channel");
