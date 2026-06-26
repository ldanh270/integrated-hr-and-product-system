-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "batchId" TEXT;

-- CreateTable
CREATE TABLE "ApplicationBatch" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationBatch_employeeId_idx" ON "ApplicationBatch"("employeeId");

-- CreateIndex
CREATE INDEX "ApplicationBatch_assignedToId_idx" ON "ApplicationBatch"("assignedToId");

-- CreateIndex
CREATE INDEX "ApplicationBatch_type_idx" ON "ApplicationBatch"("type");

-- CreateIndex
CREATE INDEX "Application_batchId_idx" ON "Application"("batchId");

-- AddForeignKey
ALTER TABLE "ApplicationBatch" ADD CONSTRAINT "ApplicationBatch_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationBatch" ADD CONSTRAINT "ApplicationBatch_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ApplicationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
