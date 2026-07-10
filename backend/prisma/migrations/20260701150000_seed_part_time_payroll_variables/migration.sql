-- Seed part-time payroll SalaryVariable rows (editable in Biến hệ thống)
INSERT INTO "SalaryVariable" ("id", "code", "name", "value", "description", "isActive", "createdById", "createdAt", "updatedAt")
SELECT
  'pt_payroll_' || seed.code,
  seed.code,
  seed.name,
  seed.value,
  seed.description,
  true,
  admin."id",
  NOW(),
  NOW()
FROM (
  VALUES
    (
      'partTimeOvertimeMultiplier',
      'Hệ số giờ tăng ca (PT)',
      1.5,
      'Nhân với đơn giá/giờ khi Spent Time loại overtime. Công thức: giờ × đơn giá × hệ số.'
    ),
    (
      'partTimeWorkingDayMultiplier',
      'Hệ số giờ làm thường (PT)',
      1,
      'Nhân với đơn giá/giờ khi Spent Time loại ngày làm thường.'
    ),
    (
      'partTimeDefaultHourlyRate',
      'Đơn giá/giờ mặc định (PT)',
      0,
      'Dùng khi thành viên dự án chưa khai báo hourlyRate. Đặt 0 để bắt buộc khai báo trên dự án.'
    )
) AS seed(code, name, value, description)
CROSS JOIN LATERAL (
  SELECT "id"
  FROM "Employee"
  WHERE "role" = 'admin' AND "deletedAt" IS NULL
  ORDER BY "createdAt" ASC
  LIMIT 1
) AS admin
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isActive" = true,
  "updatedAt" = NOW();
