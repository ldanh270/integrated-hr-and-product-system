-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "statusId" TEXT;

-- CreateTable
CREATE TABLE "ProjectTaskStatus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#A3A3A3',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTaskStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectTaskStatus_projectId_idx" ON "ProjectTaskStatus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskStatus_projectId_name_key" ON "ProjectTaskStatus"("projectId", "name");

-- CreateIndex
CREATE INDEX "Task_projectId_statusId_idx" ON "Task"("projectId", "statusId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "ProjectTaskStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskStatus" ADD CONSTRAINT "ProjectTaskStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
