-- Allow multiple part-time shift slots per employee per day (admin assign can add Khung 2+).
DROP INDEX IF EXISTS "EmployeeShift_employeeId_assignedDate_key";

CREATE UNIQUE INDEX "EmployeeShift_employeeId_assignedDate_shiftId_key"
ON "EmployeeShift"("employeeId", "assignedDate", "shiftId");
