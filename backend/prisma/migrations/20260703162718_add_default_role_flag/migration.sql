-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "roles_isDefault_idx" ON "roles"("isDefault");
