-- Split work schedule (full_time vs part_time) from employment type (full_time vs intern).
-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('full_time', 'part_time');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "workScheduleType" "WorkScheduleType" NOT NULL DEFAULT 'full_time';

-- Backfill: legacy employeeType=part_time meant part-time work schedule
UPDATE "Employee"
SET "workScheduleType" = 'part_time'
WHERE "employeeType" = 'part_time';

UPDATE "Employee"
SET "employeeType" = 'full_time'
WHERE "employeeType" = 'part_time';
