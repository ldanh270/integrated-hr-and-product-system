-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "TaskCategory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskCategory_projectId_idx" ON "TaskCategory"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCategory_projectId_name_key" ON "TaskCategory"("projectId", "name");

-- CreateIndex
CREATE INDEX "Task_categoryId_idx" ON "Task"("categoryId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaskCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCategory" ADD CONSTRAINT "TaskCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
