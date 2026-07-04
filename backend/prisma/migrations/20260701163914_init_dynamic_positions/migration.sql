-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "positionId" TEXT;

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "allowedTaskTrackers" "TaskTracker"[],
    "allowedApplicationTypes" "ApplicationType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_position_rules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "allowedTaskTrackers" "TaskTracker"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_position_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_position_rules_projectId_positionId_key" ON "project_position_rules"("projectId", "positionId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_position_rules" ADD CONSTRAINT "project_position_rules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_position_rules" ADD CONSTRAINT "project_position_rules_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
