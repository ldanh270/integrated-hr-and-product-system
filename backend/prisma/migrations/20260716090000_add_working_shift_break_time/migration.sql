ALTER TABLE "WorkingShift"
-- NULL keeps legacy shifts payable for the full interval until a break is explicitly configured.
ADD COLUMN "breakStartTime" INTEGER,
ADD COLUMN "breakEndTime" INTEGER;

ALTER TABLE "WorkingShift"
ADD CONSTRAINT "WorkingShift_break_time_check"
CHECK (
  ("breakStartTime" IS NULL AND "breakEndTime" IS NULL)
  OR (
    -- A paid interval must exist on both sides of an unpaid break.
    "startTime" < "breakStartTime"
    AND "breakStartTime" < "breakEndTime"
    AND "breakEndTime" < "endTime"
  )
);
