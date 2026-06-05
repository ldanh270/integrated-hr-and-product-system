/*
  Warnings:

  - You are about to drop the column `overtimeHours` on the `Payslip` table. All the data in the column will be lost.
  - You are about to alter the column `workingDays` on the `Payslip` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `absentDays` on the `Payslip` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "ShiftSchedule" DROP CONSTRAINT "ShiftSchedule_employeeId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "startDate" DATE;

-- AlterTable
ALTER TABLE "Payslip" DROP COLUMN "overtimeHours",
ADD COLUMN     "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "workingDays" SET DEFAULT 0,
ALTER COLUMN "workingDays" SET DATA TYPE INTEGER,
ALTER COLUMN "absentDays" SET DEFAULT 0,
ALTER COLUMN "absentDays" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "Employee_deletedAt_idx" ON "Employee"("deletedAt");

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
