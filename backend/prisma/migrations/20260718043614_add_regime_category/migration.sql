/*
  Warnings:

  - You are about to drop the column `applyToEnd` on the `ApplicationRegimeDetail` table. All the data in the column will be lost.
  - You are about to drop the column `applyToStart` on the `ApplicationRegimeDetail` table. All the data in the column will be lost.
  - You are about to drop the column `reducedMinutesPerDay` on the `ApplicationRegimeDetail` table. All the data in the column will be lost.
  - You are about to drop the column `regimeType` on the `ApplicationRegimeDetail` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[correctedByApplicationId]` on the table `AttendanceRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `regimeCategoryId` to the `ApplicationRegimeDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ApplicationType" ADD VALUE 'forgot_card';

-- AlterTable
ALTER TABLE "ApplicationRegimeDetail" DROP COLUMN "applyToEnd",
DROP COLUMN "applyToStart",
DROP COLUMN "reducedMinutesPerDay",
DROP COLUMN "regimeType",
ADD COLUMN     "earlyMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lateMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "regimeCategoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "correctedByApplicationId" TEXT;

-- CreateTable
CREATE TABLE "RegimeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxLateMinutes" INTEGER NOT NULL DEFAULT 0,
    "maxEarlyMinutes" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegimeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationForgotCardDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "documentUrl" TEXT,

    CONSTRAINT "ApplicationForgotCardDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateIndex
CREATE INDEX "RegimeCategory_createdById_idx" ON "RegimeCategory"("createdById");

-- CreateIndex
CREATE INDEX "RegimeCategory_isDefault_idx" ON "RegimeCategory"("isDefault");

-- CreateIndex
CREATE INDEX "ApplicationRegimeDetail_regimeCategoryId_idx" ON "ApplicationRegimeDetail"("regimeCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_correctedByApplicationId_key" ON "AttendanceRecord"("correctedByApplicationId");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_correctedByApplicationId_fkey" FOREIGN KEY ("correctedByApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegimeCategory" ADD CONSTRAINT "RegimeCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRegimeDetail" ADD CONSTRAINT "ApplicationRegimeDetail_regimeCategoryId_fkey" FOREIGN KEY ("regimeCategoryId") REFERENCES "RegimeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationForgotCardDetail" ADD CONSTRAINT "ApplicationForgotCardDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationForgotCardDetail" ADD CONSTRAINT "ApplicationForgotCardDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
