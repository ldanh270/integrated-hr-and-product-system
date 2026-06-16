-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "personalEmployeeId" TEXT;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_personalEmployeeId_fkey" FOREIGN KEY ("personalEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Employee_personalEmployeeId_idx" ON "Employee"("personalEmployeeId");
