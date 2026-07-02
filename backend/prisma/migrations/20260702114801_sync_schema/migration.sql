-- CreateEnum
CREATE TYPE "WfhType" AS ENUM ('full_day', 'morning', 'afternoon');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "attachmentId" TEXT,
ADD COLUMN     "attachmentUrl" TEXT;

-- AlterTable
ALTER TABLE "ApplicationOvertimeDetail" ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ApplicationWorkFromHomeDetail" ADD COLUMN     "wfhType" "WfhType" NOT NULL DEFAULT 'full_day';

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "isPaidLeave" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "totalLeaves" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "usedLeaves" INTEGER NOT NULL DEFAULT 0;
