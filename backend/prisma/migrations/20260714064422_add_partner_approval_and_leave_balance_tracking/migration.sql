/*
  Warnings:

  - You are about to drop the column `location` on the `ApplicationWorkFromHomeDetail` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Employee` table. All the data in the column will be lost.
  - The `allowedTaskTrackers` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tracker` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allowedTaskTrackers` column on the `positions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `project_position_rules` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `employeeShiftId` to the `ApplicationWorkFromHomeDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'partner_pending';

-- DropForeignKey
ALTER TABLE "project_position_rules" DROP CONSTRAINT "project_position_rules_positionId_fkey";

-- DropForeignKey
ALTER TABLE "project_position_rules" DROP CONSTRAINT "project_position_rules_projectId_fkey";

-- DropIndex
DROP INDEX "Employee_role_idx";

-- DropIndex
DROP INDEX "permissions_isActive_idx";

-- DropIndex
DROP INDEX "permissions_module_isActive_deletedAt_idx";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "partnerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "partnerApprovedById" TEXT,
ADD COLUMN     "partnerRejectReason" TEXT;

-- AlterTable
ALTER TABLE "ApplicationLeaveDetail" ADD COLUMN     "documentUrl" TEXT;

-- AlterTable
ALTER TABLE "ApplicationWorkFromHomeDetail" DROP COLUMN "location",
ADD COLUMN     "employeeShiftId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "allowedTaskTrackers",
ADD COLUMN     "allowedTaskTrackers" TEXT[];

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "roleId" TEXT;

-- AlterTable
ALTER TABLE "RealShift" ADD COLUMN     "isPaidLeave" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "tracker",
ADD COLUMN     "tracker" TEXT NOT NULL DEFAULT 'feature';

-- AlterTable
ALTER TABLE "positions" DROP COLUMN "allowedTaskTrackers",
ADD COLUMN     "allowedTaskTrackers" TEXT[];

-- DropTable
DROP TABLE "project_position_rules";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "TaskTracker";

-- CreateTable
CREATE TABLE "project_roles" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "allowedTaskTrackers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_trackers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" DECIMAL(5,2) NOT NULL,
    "usedDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_roles_projectId_name_key" ON "project_roles"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_roles_projectId_code_key" ON "project_roles"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "project_trackers_projectId_name_key" ON "project_trackers"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_trackers_projectId_code_key" ON "project_trackers"("projectId", "code");

-- CreateIndex
CREATE INDEX "EmployeeLeaveBalance_employeeId_year_idx" ON "EmployeeLeaveBalance"("employeeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLeaveBalance_employeeId_year_key" ON "EmployeeLeaveBalance"("employeeId", "year");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_partnerApprovedById_fkey" FOREIGN KEY ("partnerApprovedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkFromHomeDetail" ADD CONSTRAINT "ApplicationWorkFromHomeDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "project_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roles" ADD CONSTRAINT "project_roles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_trackers" ADD CONSTRAINT "project_trackers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveBalance" ADD CONSTRAINT "EmployeeLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
