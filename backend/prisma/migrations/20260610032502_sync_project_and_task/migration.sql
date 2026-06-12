/*
  Warnings:

  - You are about to drop the column `triggerSecond` on the `PayrollSettings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskCreationPolicy" AS ENUM ('leader_only', 'all_members');

-- AlterTable
ALTER TABLE "PayrollSettings" DROP COLUMN "triggerSecond";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "taskCreationPolicy" "TaskCreationPolicy" NOT NULL DEFAULT 'leader_only';
