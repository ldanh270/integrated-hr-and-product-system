-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('auth', 'role', 'security');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'role_assigned';
ALTER TYPE "ActivityAction" ADD VALUE 'role_revoked';
ALTER TYPE "ActivityAction" ADD VALUE 'account_locked';
ALTER TYPE "ActivityAction" ADD VALUE 'account_unlocked';

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "category" "ActivityCategory" NOT NULL DEFAULT 'auth';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ActivityLog_category_actionType_createdAt_idx" ON "ActivityLog"("category", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_category_idx" ON "ActivityLog"("category");
