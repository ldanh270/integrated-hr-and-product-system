/*
  Warnings:

  - You are about to drop the column `workingShiftId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `triggerSecond` on the `PayrollSettings` table. All the data in the column will be lost.
  - Added the required column `leaveType` to the `ApplicationLeaveDetail` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('annual_leave', 'sick_leave', 'maternity_leave', 'bereavement_leave', 'marriage_leave', 'unpaid_leave', 'other');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_workingShiftId_fkey";

-- DropIndex
DROP INDEX "Application_workingShiftId_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "workingShiftId";

-- AlterTable
ALTER TABLE "ApplicationLeaveDetail" ADD COLUMN     "leaveType" "LeaveType" NOT NULL;

-- AlterTable
ALTER TABLE "ApplicationShiftSwapDetail" ALTER COLUMN "swapWithEmployeeId" DROP NOT NULL,
ALTER COLUMN "swapWithShiftId" DROP NOT NULL;


-- CreateTable
CREATE TABLE "ApplicationBusinessTripDetail" (
    "applicationId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "purpose" TEXT,
    "budget" DECIMAL(15,2),

    CONSTRAINT "ApplicationBusinessTripDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationWorkFromHomeDetail" (
    "applicationId" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "ApplicationWorkFromHomeDetail_pkey" PRIMARY KEY ("applicationId")
);

-- AddForeignKey
ALTER TABLE "ApplicationBusinessTripDetail" ADD CONSTRAINT "ApplicationBusinessTripDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkFromHomeDetail" ADD CONSTRAINT "ApplicationWorkFromHomeDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
