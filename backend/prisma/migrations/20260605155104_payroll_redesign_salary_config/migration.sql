/*
  Warnings:

  - You are about to drop the column `baseSalary` on the `Payslip` table. All the data in the column will be lost.
  - You are about to drop the `PayrollComponent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PayrollTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PayrollTemplateComponent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `salaryConfigId` to the `Payslip` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PayrollComponent" DROP CONSTRAINT "PayrollComponent_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PayrollTemplate" DROP CONSTRAINT "PayrollTemplate_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PayrollTemplateComponent" DROP CONSTRAINT "PayrollTemplateComponent_componentId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollTemplateComponent" DROP CONSTRAINT "PayrollTemplateComponent_templateId_fkey";

-- DropForeignKey
ALTER TABLE "PayslipDetail" DROP CONSTRAINT "PayslipDetail_componentId_fkey";

-- AlterTable
ALTER TABLE "PayrollSettings" ADD COLUMN     "standardWorkingDays" INTEGER NOT NULL DEFAULT 22;

-- AlterTable
ALTER TABLE "Payslip" DROP COLUMN "baseSalary",
ADD COLUMN     "salaryConfigId" TEXT NOT NULL;

-- DropTable
DROP TABLE "PayrollComponent";

-- DropTable
DROP TABLE "PayrollTemplate";

-- DropTable
DROP TABLE "PayrollTemplateComponent";

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayslipTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipTemplateComponent" (
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "overrideFormula" TEXT,

    CONSTRAINT "PayslipTemplateComponent_pkey" PRIMARY KEY ("templateId","componentId")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryConfig" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "mealAllowance" DECIMAL(15,2),
    "transportAllowance" DECIMAL(15,2),
    "housingAllowance" DECIMAL(15,2),
    "phoneAllowance" DECIMAL(15,2),
    "responsibilityAllowance" DECIMAL(15,2),
    "seniorityAllowance" DECIMAL(15,2),
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalaryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_name_key" ON "SalaryComponent"("name");

-- CreateIndex
CREATE INDEX "SalaryComponent_type_isActive_idx" ON "SalaryComponent"("type", "isActive");

-- CreateIndex
CREATE INDEX "SalaryComponent_createdById_idx" ON "SalaryComponent"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PayslipTemplate_name_key" ON "PayslipTemplate"("name");

-- CreateIndex
CREATE INDEX "PayslipTemplate_isActive_idx" ON "PayslipTemplate"("isActive");

-- CreateIndex
CREATE INDEX "PayslipTemplate_createdById_idx" ON "PayslipTemplate"("createdById");

-- CreateIndex
CREATE INDEX "PayslipTemplateComponent_componentId_idx" ON "PayslipTemplateComponent"("componentId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_employeeId_effectiveFrom_idx" ON "EmployeeSalaryConfig"("employeeId", "effectiveFrom" DESC);

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_templateId_idx" ON "EmployeeSalaryConfig"("templateId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_effectiveTo_idx" ON "EmployeeSalaryConfig"("effectiveTo");

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_createdById_idx" ON "EmployeeSalaryConfig"("createdById");

-- CreateIndex
CREATE INDEX "Payslip_salaryConfigId_idx" ON "Payslip"("salaryConfigId");

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplate" ADD CONSTRAINT "PayslipTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplateComponent" ADD CONSTRAINT "PayslipTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PayslipTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplateComponent" ADD CONSTRAINT "PayslipTemplateComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryConfig" ADD CONSTRAINT "EmployeeSalaryConfig_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryConfig" ADD CONSTRAINT "EmployeeSalaryConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PayslipTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryConfig" ADD CONSTRAINT "EmployeeSalaryConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_salaryConfigId_fkey" FOREIGN KEY ("salaryConfigId") REFERENCES "EmployeeSalaryConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipDetail" ADD CONSTRAINT "PayslipDetail_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
