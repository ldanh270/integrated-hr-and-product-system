DO $$ BEGIN
  CREATE TYPE "HolidayScope" AS ENUM ('all', 'position', 'employees');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "HolidayCalendar" DROP CONSTRAINT IF EXISTS "HolidayCalendar_date_key";

ALTER TABLE "HolidayCalendar"
  ADD COLUMN IF NOT EXISTS "scope" "HolidayScope" NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS "positionId" TEXT,
  ADD COLUMN IF NOT EXISTS "batchId" TEXT;

CREATE TABLE IF NOT EXISTS "HolidayCalendarAssignee" (
  "holidayId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  CONSTRAINT "HolidayCalendarAssignee_pkey" PRIMARY KEY ("holidayId","employeeId")
);

DO $$ BEGIN
  ALTER TABLE "HolidayCalendar" ADD CONSTRAINT "HolidayCalendar_positionId_fkey"
    FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "HolidayCalendarAssignee" ADD CONSTRAINT "HolidayCalendarAssignee_holidayId_fkey"
    FOREIGN KEY ("holidayId") REFERENCES "HolidayCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "HolidayCalendarAssignee" ADD CONSTRAINT "HolidayCalendarAssignee_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "HolidayCalendar_date_idx" ON "HolidayCalendar"("date");
CREATE INDEX IF NOT EXISTS "HolidayCalendar_scope_date_idx" ON "HolidayCalendar"("scope", "date");
CREATE INDEX IF NOT EXISTS "HolidayCalendar_positionId_idx" ON "HolidayCalendar"("positionId");
CREATE INDEX IF NOT EXISTS "HolidayCalendar_batchId_idx" ON "HolidayCalendar"("batchId");
CREATE INDEX IF NOT EXISTS "HolidayCalendarAssignee_employeeId_idx" ON "HolidayCalendarAssignee"("employeeId");
