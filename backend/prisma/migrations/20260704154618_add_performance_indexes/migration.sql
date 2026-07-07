-- CreateIndex
CREATE INDEX "Employee_lockedUntil_idx" ON "Employee"("lockedUntil");

-- CreateIndex
CREATE INDEX "Employee_failedLoginCount_idx" ON "Employee"("failedLoginCount");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_username_idx" ON "Employee"("username");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "permissions"("isActive");

-- CreateIndex
CREATE INDEX "permissions_module_isActive_deletedAt_idx" ON "permissions"("module", "isActive", "deletedAt");
