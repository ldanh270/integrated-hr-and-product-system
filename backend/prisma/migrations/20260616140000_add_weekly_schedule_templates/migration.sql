-- DropIndex
DROP INDEX "ShiftScheduleDay_scheduleId_dayOfWeek_key";

-- AlterTable
ALTER TABLE "ShiftSchedule" ADD COLUMN     "cycleWeeks" INTEGER,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "ShiftScheduleDay" ADD COLUMN     "weekIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WeeklyScheduleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cycleWeeks" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScheduleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScheduleTemplateWeek" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,

    CONSTRAINT "WeeklyScheduleTemplateWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScheduleTemplateDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "shiftId" TEXT,

    CONSTRAINT "WeeklyScheduleTemplateDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyScheduleTemplate_isActive_idx" ON "WeeklyScheduleTemplate"("isActive");

-- CreateIndex
CREATE INDEX "WeeklyScheduleTemplate_createdById_idx" ON "WeeklyScheduleTemplate"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScheduleTemplateWeek_templateId_weekIndex_key" ON "WeeklyScheduleTemplateWeek"("templateId", "weekIndex");

-- CreateIndex
CREATE INDEX "WeeklyScheduleTemplateDay_shiftId_idx" ON "WeeklyScheduleTemplateDay"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScheduleTemplateDay_weekId_dayOfWeek_key" ON "WeeklyScheduleTemplateDay"("weekId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ShiftSchedule_templateId_idx" ON "ShiftSchedule"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftScheduleDay_scheduleId_weekIndex_dayOfWeek_key" ON "ShiftScheduleDay"("scheduleId", "weekIndex", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplate" ADD CONSTRAINT "WeeklyScheduleTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplateWeek" ADD CONSTRAINT "WeeklyScheduleTemplateWeek_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WeeklyScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplateDay" ADD CONSTRAINT "WeeklyScheduleTemplateDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "WeeklyScheduleTemplateWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplateDay" ADD CONSTRAINT "WeeklyScheduleTemplateDay_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkingShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WeeklyScheduleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
