-- CreateEnum
CREATE TYPE "TaskTracker" AS ENUM ('feature', 'bug', 'support', 'task', 'meeting', 'test', 'subtask', 'management');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "estimatedTime" DOUBLE PRECISION,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" DATE,
ADD COLUMN     "tracker" "TaskTracker" NOT NULL DEFAULT 'feature';

-- CreateTable
CREATE TABLE "SpentTime" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "activity" TEXT NOT NULL,
    "workTimeType" TEXT NOT NULL DEFAULT 'working_day',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpentTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpentTime_taskId_idx" ON "SpentTime"("taskId");

-- CreateIndex
CREATE INDEX "SpentTime_employeeId_idx" ON "SpentTime"("employeeId");

-- AddForeignKey
ALTER TABLE "SpentTime" ADD CONSTRAINT "SpentTime_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpentTime" ADD CONSTRAINT "SpentTime_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
