-- CreateEnum
CREATE TYPE "SpentTimeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ProjectMemberWorkMode" AS ENUM ('remote', 'onsite');

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN "hourlyRate" DECIMAL(12,2),
ADD COLUMN "workMode" "ProjectMemberWorkMode" NOT NULL DEFAULT 'remote';

-- AlterTable
ALTER TABLE "SpentTime" ADD COLUMN "status" "SpentTimeStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "approvedById" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "SpentTime_status_date_idx" ON "SpentTime"("status", "date");

-- AddForeignKey
ALTER TABLE "SpentTime" ADD CONSTRAINT "SpentTime_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
