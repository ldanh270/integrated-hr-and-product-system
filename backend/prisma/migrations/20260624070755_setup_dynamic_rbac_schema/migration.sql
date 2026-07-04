/*
  Warnings:

  - You are about to drop the column `role` on the `Employee` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Employee_role_idx";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "role",
ADD COLUMN     "authorizationVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "isAdministrative" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "admin_state_lock" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "admin_state_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorization_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetEmployeeId" TEXT,
    "targetRoleId" TEXT,
    "targetPermissionId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorization_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "authorization_audit_logs_actorId_idx" ON "authorization_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "authorization_audit_logs_targetEmployeeId_idx" ON "authorization_audit_logs"("targetEmployeeId");

-- CreateIndex
CREATE INDEX "authorization_audit_logs_targetRoleId_idx" ON "authorization_audit_logs"("targetRoleId");

-- CreateIndex
CREATE INDEX "authorization_audit_logs_createdAt_idx" ON "authorization_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "authorization_audit_logs_action_idx" ON "authorization_audit_logs"("action");

-- CreateIndex
CREATE INDEX "Employee_status_deletedAt_idx" ON "Employee"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "roles_isAdministrative_isActive_deletedAt_idx" ON "roles"("isAdministrative", "isActive", "deletedAt");

-- AddForeignKey
ALTER TABLE "authorization_audit_logs" ADD CONSTRAINT "authorization_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorization_audit_logs" ADD CONSTRAINT "authorization_audit_logs_targetEmployeeId_fkey" FOREIGN KEY ("targetEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
