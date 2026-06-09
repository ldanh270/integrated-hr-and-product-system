/*
  Warnings:

  - You are about to drop the column `customFields` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `housingAllowance` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `mealAllowance` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `phoneAllowance` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `responsibilityAllowance` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `seniorityAllowance` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `transportAllowance` on the `EmployeeSalaryConfig` table. All the data in the column will be lost.
  - You are about to drop the column `standardWorkingDays` on the `PayrollSettings` table. All the data in the column will be lost.
  - You are about to drop the `CustomSalaryField` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[periodYear,periodMonth,name]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SalaryComponent` will be added. If there are existing duplicate values, this will fail.
  - The required column `code` was added to the `SalaryComponent` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ComponentValueType" AS ENUM ('currency', 'number', 'percentage');

-- DropIndex
DROP INDEX "Payroll_periodYear_periodMonth_key";

-- AlterTable
ALTER TABLE "EmployeeSalaryConfig" DROP COLUMN "customFields",
DROP COLUMN "housingAllowance",
DROP COLUMN "mealAllowance",
DROP COLUMN "phoneAllowance",
DROP COLUMN "responsibilityAllowance",
DROP COLUMN "seniorityAllowance",
DROP COLUMN "transportAllowance";

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Bảng lương';

-- AlterTable
ALTER TABLE "PayrollSettings" DROP COLUMN "standardWorkingDays",
ADD COLUMN     "triggerHour" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triggerMinute" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triggerSecond" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SalaryComponent" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "valueType" "ComponentValueType" NOT NULL DEFAULT 'currency';

-- DropTable
DROP TABLE "CustomSalaryField";

-- CreateTable
CREATE TABLE "SalaryVariable" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryVariable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryVariable_code_key" ON "SalaryVariable"("code");

-- CreateIndex
CREATE INDEX "SalaryVariable_isActive_idx" ON "SalaryVariable"("isActive");

-- CreateIndex
CREATE INDEX "SalaryVariable_createdById_idx" ON "SalaryVariable"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_periodYear_periodMonth_name_key" ON "Payroll"("periodYear", "periodMonth", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_code_key" ON "SalaryComponent"("code");

-- AddForeignKey
ALTER TABLE "SalaryVariable" ADD CONSTRAINT "SalaryVariable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
