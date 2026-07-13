/*
  Warnings:

  - The values [background_check] on the enum `JobApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `role` on the `Employee` table. All the data in the column will be lost.
  - The `allowedTaskTrackers` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tracker` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allowedTaskTrackers` column on the `positions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `project_position_rules` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobApplicationStatus_new" AS ENUM ('new', 'reviewing', 'shortlisted', 'interviewing', 'final_review', 'offer_sent', 'offer_accepted', 'pending_onboarding', 'hired', 'rejected', 'offer_declined', 'offer_rescinded', 'candidate_withdrew');
ALTER TABLE "public"."JobApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "JobApplication" ALTER COLUMN "status" TYPE "JobApplicationStatus_new" USING ("status"::text::"JobApplicationStatus_new");
ALTER TYPE "JobApplicationStatus" RENAME TO "JobApplicationStatus_old";
ALTER TYPE "JobApplicationStatus_new" RENAME TO "JobApplicationStatus";
DROP TYPE "public"."JobApplicationStatus_old";
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET DEFAULT 'new';
COMMIT;

-- DropForeignKey
ALTER TABLE "project_position_rules" DROP CONSTRAINT "project_position_rules_positionId_fkey";

-- DropForeignKey
ALTER TABLE "project_position_rules" DROP CONSTRAINT "project_position_rules_projectId_fkey";

-- DropIndex
DROP INDEX "Employee_role_idx";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "allowedTaskTrackers",
ADD COLUMN     "allowedTaskTrackers" TEXT[];

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "roleId" TEXT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "tracker",
ADD COLUMN     "tracker" TEXT NOT NULL DEFAULT 'feature';

-- AlterTable
ALTER TABLE "positions" DROP COLUMN "allowedTaskTrackers",
ADD COLUMN     "allowedTaskTrackers" TEXT[];

-- DropTable
DROP TABLE "project_position_rules";

-- DropEnum
DROP TYPE "PostingStatus";

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

-- CreateIndex
CREATE UNIQUE INDEX "project_roles_projectId_name_key" ON "project_roles"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_roles_projectId_code_key" ON "project_roles"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "project_trackers_projectId_name_key" ON "project_trackers"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_trackers_projectId_code_key" ON "project_trackers"("projectId", "code");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "project_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roles" ADD CONSTRAINT "project_roles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_trackers" ADD CONSTRAINT "project_trackers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
