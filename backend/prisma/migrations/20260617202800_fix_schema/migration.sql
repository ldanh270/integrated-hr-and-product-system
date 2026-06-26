-- AlterEnum
ALTER TYPE "ApplicationType" ADD VALUE 'resignation';

-- DropIndex
DROP INDEX IF EXISTS "Employee_personalEmployeeId_idx";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "Application_assignedToId_idx" ON "Application"("assignedToId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
