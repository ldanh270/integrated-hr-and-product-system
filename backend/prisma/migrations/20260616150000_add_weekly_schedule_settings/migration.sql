-- CreateTable
CREATE TABLE "WeeklyScheduleSettings" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "triggerDayOfWeek" INTEGER NOT NULL,
    "triggerHour" INTEGER NOT NULL DEFAULT 7,
    "triggerMinute" INTEGER NOT NULL DEFAULT 0,
    "lastGeneratedWeekKey" TEXT,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScheduleSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyScheduleSettings_updatedById_idx" ON "WeeklyScheduleSettings"("updatedById");

-- AddForeignKey
ALTER TABLE "WeeklyScheduleSettings" ADD CONSTRAINT "WeeklyScheduleSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint
ALTER TABLE "WeeklyScheduleSettings"
ADD CONSTRAINT "WeeklyScheduleSettings_triggerDayOfWeek_check"
CHECK ("triggerDayOfWeek" BETWEEN 0 AND 6);

ALTER TABLE "WeeklyScheduleSettings"
ADD CONSTRAINT "WeeklyScheduleSettings_triggerHour_check"
CHECK ("triggerHour" BETWEEN 0 AND 23);

ALTER TABLE "WeeklyScheduleSettings"
ADD CONSTRAINT "WeeklyScheduleSettings_triggerMinute_check"
CHECK ("triggerMinute" BETWEEN 0 AND 59);
