-- Restore Employee.role removed by external dynamic RBAC migrations.
-- Current application code still reads auth role from this column.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('admin', 'hr_manager', 'general_manager', 'team_leader', 'employee');
  END IF;
END $$;

ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'employee';

CREATE INDEX IF NOT EXISTS "Employee_role_idx" ON "Employee"("role");

-- Backfill from RBAC assignment when available (roles.name matches enum values).
UPDATE "Employee" AS e
SET "role" = r.name::"Role"
FROM "employee_roles" AS er
JOIN "roles" AS r ON r.id = er."roleId"
WHERE er."employeeId" = e.id
  AND r.name IN ('admin', 'hr_manager', 'general_manager', 'team_leader', 'employee');
