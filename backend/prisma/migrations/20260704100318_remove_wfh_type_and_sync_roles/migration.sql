/*
  Warnings:

  - You are about to drop the column `wfhType` on the `ApplicationWorkFromHomeDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicationWorkFromHomeDetail" DROP COLUMN "wfhType";

-- DropEnum
DROP TYPE "WfhType";
