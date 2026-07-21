ALTER TABLE "JobRequisition" ADD COLUMN "approverId" TEXT;

CREATE INDEX "JobRequisition_approverId_idx" ON "JobRequisition"("approverId");

ALTER TABLE "JobRequisition"
ADD CONSTRAINT "JobRequisition_approverId_fkey"
FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
