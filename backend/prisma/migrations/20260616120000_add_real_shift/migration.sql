-- CreateTable
CREATE TABLE "RealShift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "actualStartTime" INTEGER NOT NULL,
    "actualEndTime" INTEGER,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RealShift_attendanceRecordId_key" ON "RealShift"("attendanceRecordId");

-- CreateIndex
CREATE INDEX "RealShift_employeeId_date_idx" ON "RealShift"("employeeId", "date" DESC);

-- CreateIndex
CREATE INDEX "RealShift_isMatched_date_idx" ON "RealShift"("isMatched", "date" DESC);

-- AddForeignKey
ALTER TABLE "RealShift" ADD CONSTRAINT "RealShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealShift" ADD CONSTRAINT "RealShift_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing attendance records that already have check-in data
INSERT INTO "RealShift" (
    "id",
    "employeeId",
    "attendanceRecordId",
    "date",
    "actualStartTime",
    "actualEndTime",
    "isMatched",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    ar."employeeId",
    ar."id",
    ar."date",
    (EXTRACT(HOUR FROM ar."checkInAt") * 60 + EXTRACT(MINUTE FROM ar."checkInAt"))::INTEGER,
    CASE
        WHEN ar."checkOutAt" IS NULL THEN NULL
        ELSE (EXTRACT(HOUR FROM ar."checkOutAt") * 60 + EXTRACT(MINUTE FROM ar."checkOutAt"))::INTEGER
    END,
    CASE
        WHEN ar."checkOutAt" IS NULL THEN false
        WHEN ws."startTime" IS NULL THEN false
        ELSE (
            (EXTRACT(HOUR FROM ar."checkInAt") * 60 + EXTRACT(MINUTE FROM ar."checkInAt"))::INTEGER = ws."startTime"
            AND (EXTRACT(HOUR FROM ar."checkOutAt") * 60 + EXTRACT(MINUTE FROM ar."checkOutAt"))::INTEGER = ws."endTime"
        )
    END,
    ar."createdAt",
    ar."updatedAt"
FROM "AttendanceRecord" ar
JOIN "EmployeeShift" es ON es."id" = ar."employeeShiftId"
JOIN "WorkingShift" ws ON ws."id" = es."shiftId"
WHERE ar."checkInAt" IS NOT NULL
ON CONFLICT ("attendanceRecordId") DO NOTHING;
