-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'hr_manager', 'general_manager', 'team_leader', 'employee');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'inactive', 'on_leave', 'terminated');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('full_time', 'part_time', 'contractor', 'intern');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('on_time', 'late', 'early_leave', 'absent', 'overtime');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('scheduled', 'holiday_pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('national', 'company');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('leave', 'overtime', 'work_from_home', 'shift_swap', 'business_trip', 'late_early', 'regime');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "RegimeType" AS ENUM ('paid', 'unpaid');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'paid');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('addition', 'deduction');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'in_review', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "PasswordResetStatus" AS ENUM ('pending', 'approved', 'rejected', 'used', 'expired');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('login', 'logout', 'failed_login');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'employee',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationalId" TEXT,
    "address" TEXT,
    "avatarUrl" TEXT,
    "avatarId" TEXT,
    "position" TEXT,
    "employeeType" "EmployeeType" NOT NULL DEFAULT 'full_time',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingShift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "gpsRadiusMeters" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workingShiftId" TEXT,

    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftScheduleDay" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "shiftId" TEXT NOT NULL,

    CONSTRAINT "ShiftScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeShift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "assignedDate" DATE NOT NULL,
    "scheduleId" TEXT,
    "status" "ShiftStatus" NOT NULL DEFAULT 'scheduled',
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkOutAt" TIMESTAMP(3),
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyLeaveMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workingShiftId" TEXT,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLeaveDetail" (
    "applicationId" TEXT NOT NULL,
    "regimeType" "RegimeType" NOT NULL,

    CONSTRAINT "ApplicationLeaveDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationShiftSwapDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,
    "workingShiftId" TEXT,
    "swapWithEmployeeId" TEXT NOT NULL,
    "swapWithShiftId" TEXT NOT NULL,

    CONSTRAINT "ApplicationShiftSwapDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationOvertimeDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,

    CONSTRAINT "ApplicationOvertimeDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationRegimeDetail" (
    "applicationId" TEXT NOT NULL,
    "regimeType" TEXT NOT NULL,
    "reducedMinutesPerDay" INTEGER NOT NULL DEFAULT 0,
    "applyToStart" BOOLEAN NOT NULL DEFAULT false,
    "applyToEnd" BOOLEAN NOT NULL DEFAULT false,
    "documentUrl" TEXT,

    CONSTRAINT "ApplicationRegimeDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationLateEarlyDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isLate" BOOLEAN NOT NULL,

    CONSTRAINT "ApplicationLateEarlyDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "HolidayCalendar" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HolidayType" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolidayCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollTemplateComponent" (
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "overrideFormula" TEXT,

    CONSTRAINT "PayrollTemplateComponent_pkey" PRIMARY KEY ("templateId","componentId")
);

-- CreateTable
CREATE TABLE "PayrollSettings" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "triggerDay" INTEGER NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'draft',
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "totalAdditions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL,
    "workingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "absentDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipDetail" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "PayslipDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "techStack" TEXT[],
    "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "teamLeaderId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","employeeId")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "actionType" "ActivityAction" NOT NULL,
    "ipAddress" TEXT,
    "details" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "PasswordResetStatus" NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_username_key" ON "Employee"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_phone_key" ON "Employee"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nationalId_key" ON "Employee"("nationalId");

-- CreateIndex
CREATE INDEX "Employee_status_employeeType_idx" ON "Employee"("status", "employeeType");

-- CreateIndex
CREATE INDEX "Employee_role_idx" ON "Employee"("role");

-- CreateIndex
CREATE INDEX "WorkingShift_isActive_idx" ON "WorkingShift"("isActive");

-- CreateIndex
CREATE INDEX "WorkingShift_createdById_idx" ON "WorkingShift"("createdById");

-- CreateIndex
CREATE INDEX "ShiftSchedule_employeeId_validFrom_idx" ON "ShiftSchedule"("employeeId", "validFrom" DESC);

-- CreateIndex
CREATE INDEX "ShiftSchedule_validTo_idx" ON "ShiftSchedule"("validTo");

-- CreateIndex
CREATE INDEX "ShiftSchedule_createdById_idx" ON "ShiftSchedule"("createdById");

-- CreateIndex
CREATE INDEX "ShiftScheduleDay_shiftId_idx" ON "ShiftScheduleDay"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftScheduleDay_scheduleId_dayOfWeek_key" ON "ShiftScheduleDay"("scheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "EmployeeShift_shiftId_assignedDate_idx" ON "EmployeeShift"("shiftId", "assignedDate");

-- CreateIndex
CREATE INDEX "EmployeeShift_status_assignedDate_idx" ON "EmployeeShift"("status", "assignedDate");

-- CreateIndex
CREATE INDEX "EmployeeShift_scheduleId_idx" ON "EmployeeShift"("scheduleId");

-- CreateIndex
CREATE INDEX "EmployeeShift_createdById_idx" ON "EmployeeShift"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeShift_employeeId_assignedDate_key" ON "EmployeeShift"("employeeId", "assignedDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeShiftId_key" ON "AttendanceRecord"("employeeShiftId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_employeeId_date_idx" ON "AttendanceRecord"("employeeId", "date" DESC);

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_date_idx" ON "AttendanceRecord"("status", "date" DESC);

-- CreateIndex
CREATE INDEX "Application_employeeId_status_idx" ON "Application"("employeeId", "status");

-- CreateIndex
CREATE INDEX "Application_employeeId_startDate_idx" ON "Application"("employeeId", "startDate" DESC);

-- CreateIndex
CREATE INDEX "Application_status_type_idx" ON "Application"("status", "type");

-- CreateIndex
CREATE INDEX "Application_approvedById_idx" ON "Application"("approvedById");

-- CreateIndex
CREATE INDEX "Application_workingShiftId_idx" ON "Application"("workingShiftId");

-- CreateIndex
CREATE INDEX "ApplicationShiftSwapDetail_employeeShiftId_idx" ON "ApplicationShiftSwapDetail"("employeeShiftId");

-- CreateIndex
CREATE INDEX "ApplicationShiftSwapDetail_workingShiftId_idx" ON "ApplicationShiftSwapDetail"("workingShiftId");

-- CreateIndex
CREATE INDEX "ApplicationShiftSwapDetail_swapWithEmployeeId_idx" ON "ApplicationShiftSwapDetail"("swapWithEmployeeId");

-- CreateIndex
CREATE INDEX "ApplicationShiftSwapDetail_swapWithShiftId_idx" ON "ApplicationShiftSwapDetail"("swapWithShiftId");

-- CreateIndex
CREATE INDEX "ApplicationOvertimeDetail_employeeShiftId_idx" ON "ApplicationOvertimeDetail"("employeeShiftId");

-- CreateIndex
CREATE INDEX "ApplicationLateEarlyDetail_employeeShiftId_idx" ON "ApplicationLateEarlyDetail"("employeeShiftId");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayCalendar_date_key" ON "HolidayCalendar"("date");

-- CreateIndex
CREATE INDEX "HolidayCalendar_type_date_idx" ON "HolidayCalendar"("type", "date");

-- CreateIndex
CREATE INDEX "HolidayCalendar_createdById_idx" ON "HolidayCalendar"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollComponent_name_key" ON "PayrollComponent"("name");

-- CreateIndex
CREATE INDEX "PayrollComponent_type_isActive_idx" ON "PayrollComponent"("type", "isActive");

-- CreateIndex
CREATE INDEX "PayrollComponent_createdById_idx" ON "PayrollComponent"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollTemplate_name_key" ON "PayrollTemplate"("name");

-- CreateIndex
CREATE INDEX "PayrollTemplate_isActive_idx" ON "PayrollTemplate"("isActive");

-- CreateIndex
CREATE INDEX "PayrollTemplate_createdById_idx" ON "PayrollTemplate"("createdById");

-- CreateIndex
CREATE INDEX "PayrollTemplateComponent_componentId_idx" ON "PayrollTemplateComponent"("componentId");

-- CreateIndex
CREATE INDEX "PayrollSettings_updatedById_idx" ON "PayrollSettings"("updatedById");

-- CreateIndex
CREATE INDEX "Payroll_status_idx" ON "Payroll"("status");

-- CreateIndex
CREATE INDEX "Payroll_approvedById_idx" ON "Payroll"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_periodYear_periodMonth_key" ON "Payroll"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_payrollId_idx" ON "Payslip"("employeeId", "payrollId" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrollId_employeeId_key" ON "Payslip"("payrollId", "employeeId");

-- CreateIndex
CREATE INDEX "PayslipDetail_payslipId_idx" ON "PayslipDetail"("payslipId");

-- CreateIndex
CREATE INDEX "PayslipDetail_componentId_idx" ON "PayslipDetail"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_teamLeaderId_status_idx" ON "Project"("teamLeaderId", "status");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "ProjectMember_employeeId_idx" ON "ProjectMember"("employeeId");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_status_idx" ON "Task"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "ActivityLog_employeeId_createdAt_idx" ON "ActivityLog"("employeeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_expiresAt_idx" ON "ActivityLog"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetRequest_token_key" ON "PasswordResetRequest"("token");

-- CreateIndex
CREATE INDEX "PasswordResetRequest_employeeId_status_idx" ON "PasswordResetRequest"("employeeId", "status");

-- CreateIndex
CREATE INDEX "PasswordResetRequest_expiresAt_idx" ON "PasswordResetRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetRequest_approvedById_idx" ON "PasswordResetRequest"("approvedById");

-- AddForeignKey
ALTER TABLE "WorkingShift" ADD CONSTRAINT "WorkingShift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftScheduleDay" ADD CONSTRAINT "ShiftScheduleDay_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ShiftSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftScheduleDay" ADD CONSTRAINT "ShiftScheduleDay_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkingShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShift" ADD CONSTRAINT "EmployeeShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShift" ADD CONSTRAINT "EmployeeShift_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkingShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShift" ADD CONSTRAINT "EmployeeShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ShiftSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShift" ADD CONSTRAINT "EmployeeShift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_workingShiftId_fkey" FOREIGN KEY ("workingShiftId") REFERENCES "WorkingShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLeaveDetail" ADD CONSTRAINT "ApplicationLeaveDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationShiftSwapDetail" ADD CONSTRAINT "ApplicationShiftSwapDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationShiftSwapDetail" ADD CONSTRAINT "ApplicationShiftSwapDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationShiftSwapDetail" ADD CONSTRAINT "ApplicationShiftSwapDetail_workingShiftId_fkey" FOREIGN KEY ("workingShiftId") REFERENCES "WorkingShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationShiftSwapDetail" ADD CONSTRAINT "ApplicationShiftSwapDetail_swapWithEmployeeId_fkey" FOREIGN KEY ("swapWithEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationShiftSwapDetail" ADD CONSTRAINT "ApplicationShiftSwapDetail_swapWithShiftId_fkey" FOREIGN KEY ("swapWithShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOvertimeDetail" ADD CONSTRAINT "ApplicationOvertimeDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOvertimeDetail" ADD CONSTRAINT "ApplicationOvertimeDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRegimeDetail" ADD CONSTRAINT "ApplicationRegimeDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLateEarlyDetail" ADD CONSTRAINT "ApplicationLateEarlyDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLateEarlyDetail" ADD CONSTRAINT "ApplicationLateEarlyDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendar" ADD CONSTRAINT "HolidayCalendar_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollComponent" ADD CONSTRAINT "PayrollComponent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTemplate" ADD CONSTRAINT "PayrollTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTemplateComponent" ADD CONSTRAINT "PayrollTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PayrollTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTemplateComponent" ADD CONSTRAINT "PayrollTemplateComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "PayrollComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettings" ADD CONSTRAINT "PayrollSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipDetail" ADD CONSTRAINT "PayslipDetail_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipDetail" ADD CONSTRAINT "PayslipDetail_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "PayrollComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migration specific constraints
ALTER TABLE "WorkingShift"
  ADD CONSTRAINT "working_shift_start_time_valid"
    CHECK ("startTime" >= 0 AND "startTime" < 1440),
  ADD CONSTRAINT "working_shift_end_time_valid"
    CHECK ("endTime" >= 0 AND "endTime" <= 1440),
  ADD CONSTRAINT "working_shift_grace_period_valid"
    CHECK ("gracePeriodMinutes" >= 0 AND "gracePeriodMinutes" <= 120),
  ADD CONSTRAINT "working_shift_gps_radius_valid"
    CHECK ("gpsRadiusMeters" > 0);

    -- Payroll
ALTER TABLE "Payroll"
  ADD CONSTRAINT "payroll_period_month_valid"
    CHECK ("periodMonth" BETWEEN 1 AND 12),
  ADD CONSTRAINT "payroll_period_year_valid"
    CHECK ("periodYear" >= 2020 AND "periodYear" <= 2100);

-- PayrollSettings
ALTER TABLE "PayrollSettings"
  ADD CONSTRAINT "payroll_settings_trigger_day_valid"
    CHECK ("triggerDay" BETWEEN 1 AND 31);

-- Project
ALTER TABLE "Project"
  ADD CONSTRAINT "project_dates_valid"
    CHECK (
      ("expectedEndDate" IS NULL OR "startDate" IS NULL OR "startDate" <= "expectedEndDate")
      AND
      ("actualEndDate" IS NULL OR "startDate" IS NULL OR "startDate" <= "actualEndDate")
    );