/*
  Warnings:

  - You are about to drop the column `workingShiftId` on the `ShiftSchedule` table. All the data in the column will be lost.
  - Changed the type of `regimeType` on the `ApplicationRegimeDetail` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Employee_email_key";

-- DropIndex
DROP INDEX "Employee_nationalId_key";

-- DropIndex
DROP INDEX "Employee_phone_key";

-- DropIndex
DROP INDEX "Employee_username_key";

-- AlterTable
ALTER TABLE "ApplicationRegimeDetail" DROP COLUMN "regimeType",
ADD COLUMN     "regimeType" "RegimeType" NOT NULL;

-- AlterTable
ALTER TABLE "ShiftSchedule" DROP COLUMN "workingShiftId";

-- Create partial unique indexes to support soft delete
CREATE UNIQUE INDEX "employee_email_unique_active"
  ON "Employee" ("email") WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "employee_username_unique_active"
  ON "Employee" ("username") WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "employee_phone_unique_active"
  ON "Employee" ("phone") WHERE "deletedAt" IS NULL AND "phone" IS NOT NULL;

CREATE UNIQUE INDEX "employee_national_id_unique_active"
  ON "Employee" ("nationalId") WHERE "deletedAt" IS NULL AND "nationalId" IS NOT NULL;
