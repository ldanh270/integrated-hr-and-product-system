ALTER TABLE "WorkingShift"
ADD COLUMN "breakStartTime" INTEGER,
ADD COLUMN "breakEndTime" INTEGER;

ALTER TABLE "WorkingShift"
ADD CONSTRAINT "WorkingShift_break_time_check"
CHECK (
  ("breakStartTime" IS NULL AND "breakEndTime" IS NULL)
  OR (
    "startTime" < "breakStartTime"
    AND "breakStartTime" < "breakEndTime"
    AND "breakEndTime" < "endTime"
  )
);
