-- Repair rows created with legacy employeeType=part_time after workScheduleType was introduced
UPDATE "Employee"
SET "workScheduleType" = 'part_time'
WHERE "employeeType" = 'part_time';

UPDATE "Employee"
SET "employeeType" = 'full_time'
WHERE "employeeType" = 'part_time';
