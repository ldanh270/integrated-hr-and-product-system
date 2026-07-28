-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'inactive', 'on_leave', 'terminated');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('full_time', 'part_time', 'contractor', 'intern');

-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('full_time', 'part_time');

-- CreateEnum
CREATE TYPE "SpentTimeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ProjectMemberWorkMode" AS ENUM ('remote', 'onsite');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('on_time', 'late', 'early_leave', 'absent', 'overtime');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('scheduled', 'holiday_pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('national', 'company');

-- CreateEnum
CREATE TYPE "HolidayScope" AS ENUM ('all', 'position', 'employees');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('annual_leave', 'sick_leave', 'maternity_leave', 'bereavement_leave', 'marriage_leave', 'unpaid_leave', 'other');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('leave', 'overtime', 'work_from_home', 'shift_swap', 'business_trip', 'late_early', 'regime', 'resignation', 'forgot_card', 'recruitment');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'partner_pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "RegimeType" AS ENUM ('paid', 'unpaid');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'paid');

-- CreateEnum
CREATE TYPE "PartTimeAvailabilityStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('addition', 'deduction');

-- CreateEnum
CREATE TYPE "ComponentValueType" AS ENUM ('currency', 'number', 'percentage');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskCreationPolicy" AS ENUM ('leader_only', 'all_members');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'in_review', 'done', 'cancelled', 'reopened');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "PasswordResetStatus" AS ENUM ('pending', 'approved', 'rejected', 'used', 'expired');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('auth', 'role', 'security');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('login', 'logout', 'failed_login', 'role_assigned', 'role_revoked', 'account_locked', 'account_unlocked');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('trial', 'definite', 'indefinite', 'service');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'pending_signature', 'active', 'expired', 'terminated', 'renewed');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'closed', 'filled');

-- CreateEnum
CREATE TYPE "RequisitionPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "PostingStatus" AS ENUM ('draft', 'open', 'paused', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "RecruitmentChannel" AS ENUM ('linkedin', 'facebook', 'google_form', 'company_website', 'agency', 'referral', 'other');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('not_configured', 'ready', 'error');

-- CreateEnum
CREATE TYPE "RecruitmentApplicationStatus" AS ENUM ('new', 'reviewing', 'shortlisted', 'interviewing', 'final_review', 'offer_sent', 'offer_accepted', 'offer_declined', 'offer_rescinded', 'background_check', 'pending_onboarding', 'hired', 'rejected', 'candidate_withdrew');

-- CreateEnum
CREATE TYPE "RecruitmentSource" AS ENUM ('website', 'linkedin', 'referral', 'facebook', 'recruitment_agency', 'google_form', 'company_website', 'agency', 'other');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('in_person', 'video_call', 'phone');

-- CreateEnum
CREATE TYPE "InterviewRoundStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "InterviewResult" AS ENUM ('pass', 'fail', 'pending', 'no_show');

-- CreateEnum
CREATE TYPE "BgcGroup" AS ENUM ('a', 'b', 'c', 'd');

-- CreateEnum
CREATE TYPE "BgcStatus" AS ENUM ('pending', 'in_progress', 'completed', 'passed', 'failed');

-- CreateEnum
CREATE TYPE "RecruitmentOfferStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined', 'rescinded', 'expired');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('received', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "RecruitmentFieldType" AS ENUM ('short_text', 'paragraph');

-- CreateTable
CREATE TABLE "EmployeeContract" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT,
    "signedDate" DATE,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "trialEndDate" DATE,
    "salary" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "allowances" JSONB,
    "attachments" TEXT[],
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "terminationReason" TEXT,
    "terminationDate" TIMESTAMP(3),
    "probationSalary" DECIMAL(15,2),
    "probationSalaryRate" DECIMAL(5,2),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "note" TEXT,
    "renewedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationalId" TEXT,
    "address" TEXT,
    "avatarUrl" TEXT,
    "avatarId" TEXT,
    "position" TEXT,
    "positionId" TEXT,
    "employeeType" "EmployeeType" NOT NULL DEFAULT 'full_time',
    "workScheduleType" "WorkScheduleType" NOT NULL DEFAULT 'full_time',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "startDate" DATE,
    "endDate" DATE,
    "lastLoginAt" TIMESTAMP(3),
    "personalEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "authorizationVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingShift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "breakStartTime" INTEGER,
    "breakEndTime" INTEGER,
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
CREATE TABLE "WeeklyScheduleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cycleWeeks" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScheduleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScheduleTemplateWeek" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,

    CONSTRAINT "WeeklyScheduleTemplateWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScheduleTemplateDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "shiftId" TEXT,

    CONSTRAINT "WeeklyScheduleTemplateDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "templateId" TEXT,
    "cycleWeeks" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftScheduleDay" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL DEFAULT 0,
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
    "correctedByApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealShift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "actualStartTime" INTEGER NOT NULL,
    "actualEndTime" INTEGER,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "isPaidLeave" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealShift_pkey" PRIMARY KEY ("id")
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
    "partnerApprovedById" TEXT,
    "partnerApprovedAt" TIMESTAMP(3),
    "partnerRejectReason" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLeaveDetail" (
    "applicationId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "regimeType" "RegimeType" NOT NULL,
    "documentUrl" TEXT,

    CONSTRAINT "ApplicationLeaveDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationShiftSwapDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,
    "workingShiftId" TEXT,
    "swapWithEmployeeId" TEXT,
    "swapWithShiftId" TEXT,

    CONSTRAINT "ApplicationShiftSwapDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationOvertimeDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,

    CONSTRAINT "ApplicationOvertimeDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "RegimeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxLateMinutes" INTEGER NOT NULL DEFAULT 0,
    "maxEarlyMinutes" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegimeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationRegimeDetail" (
    "applicationId" TEXT NOT NULL,
    "regimeCategoryId" TEXT NOT NULL,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyMinutes" INTEGER NOT NULL DEFAULT 0,
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
CREATE TABLE "ApplicationBusinessTripDetail" (
    "applicationId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "purpose" TEXT,
    "budget" DECIMAL(15,2),

    CONSTRAINT "ApplicationBusinessTripDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationWorkFromHomeDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,

    CONSTRAINT "ApplicationWorkFromHomeDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "HolidayCalendar" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HolidayType" NOT NULL,
    "scope" "HolidayScope" NOT NULL DEFAULT 'all',
    "positionId" TEXT,
    "batchId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolidayCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayCalendarAssignee" (
    "holidayId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "HolidayCalendarAssignee_pkey" PRIMARY KEY ("holidayId","employeeId")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "valueType" "ComponentValueType" NOT NULL DEFAULT 'currency',
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayslipTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipTemplateComponent" (
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "overrideFormula" TEXT,

    CONSTRAINT "PayslipTemplateComponent_pkey" PRIMARY KEY ("templateId","componentId")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryConfig" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalaryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryVariable" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryVariable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSettings" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "triggerDay" INTEGER NOT NULL,
    "triggerHour" INTEGER NOT NULL DEFAULT 0,
    "triggerMinute" INTEGER NOT NULL DEFAULT 0,
    "approvalDay" INTEGER NOT NULL DEFAULT 10,
    "approvalHour" INTEGER NOT NULL DEFAULT 0,
    "approvalMinute" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScheduleSettings" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "triggerDayOfWeek" INTEGER NOT NULL,
    "triggerHour" INTEGER NOT NULL DEFAULT 7,
    "triggerMinute" INTEGER NOT NULL DEFAULT 0,
    "lastGeneratedWeekKey" TEXT,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScheduleSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartTimeWeeklyAvailability" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "status" "PartTimeAvailabilityStatus" NOT NULL DEFAULT 'submitted',
    "note" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartTimeWeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartTimeAvailabilityDay" (
    "id" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isBusyAllDay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartTimeAvailabilityDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartTimeAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartTimeAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Bảng lương',
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
    "salaryConfigId" TEXT NOT NULL,
    "totalAdditions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
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
    "taskCreationPolicy" "TaskCreationPolicy" NOT NULL DEFAULT 'leader_only',
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "dealTargetPercent" DOUBLE PRECISION,
    "teamLeaderId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allowedTaskTrackers" TEXT[],

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "hourlyRate" DECIMAL(12,2),
    "workMode" "ProjectMemberWorkMode" NOT NULL DEFAULT 'remote',
    "roleId" TEXT,
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
    "tracker" TEXT NOT NULL DEFAULT 'feature',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "startDate" DATE,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedTime" DOUBLE PRECISION,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultUrl" TEXT,
    "resultNotes" TEXT,
    "rejectionReason" TEXT,
    "parentTaskId" TEXT,
    "statusId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "category" "ActivityCategory" NOT NULL DEFAULT 'auth',
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

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpentTime" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "activity" TEXT NOT NULL,
    "workTimeType" TEXT NOT NULL DEFAULT 'working_day',
    "status" "SpentTimeStatus" NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpentTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdministrative" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_state_lock" (
    "id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "admin_state_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "employee_roles" (
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("employeeId","roleId")
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

-- CreateTable
CREATE TABLE "CustomQuery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'gantt',
    "projectId" TEXT,
    "employeeId" TEXT NOT NULL,
    "queryData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTaskStatus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#A3A3A3',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTaskStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "allowedTaskTrackers" TEXT[],
    "allowedApplicationTypes" "ApplicationType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_roles" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "allowedTaskTrackers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_trackers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" DECIMAL(5,2) NOT NULL,
    "usedDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationForgotCardDetail" (
    "applicationId" TEXT NOT NULL,
    "employeeShiftId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "documentUrl" TEXT,

    CONSTRAINT "ApplicationForgotCardDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationRecruitmentDetail" (
    "applicationId" TEXT NOT NULL,
    "positionId" TEXT,
    "positionName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requirements" TEXT,

    CONSTRAINT "ApplicationRecruitmentDetail_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "positionLevel" TEXT,
    "employmentType" "EmployeeType" NOT NULL,
    "salaryMin" DECIMAL(15,2),
    "salaryMax" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "filledCount" INTEGER NOT NULL DEFAULT 0,
    "priority" "RequisitionPriority" NOT NULL DEFAULT 'medium',
    "status" "RequisitionStatus" NOT NULL DEFAULT 'draft',
    "reason" TEXT,
    "targetHireDate" DATE,
    "targetCloseDate" DATE,
    "summary" TEXT,
    "responsibilities" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "requestedById" TEXT NOT NULL,
    "approverId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalComment" TEXT,
    "positionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "channel" "RecruitmentChannel" NOT NULL,
    "source" "RecruitmentSource" NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "formFields" JSONB,
    "status" "PostingStatus" NOT NULL DEFAULT 'draft',
    "postingUrl" TEXT,
    "externalId" TEXT,
    "connectorStatus" "ConnectorStatus" NOT NULL DEFAULT 'not_configured',
    "oauthAccountId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "archivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateFieldDefinition" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RecruitmentFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingFieldSnapshot" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RecruitmentFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "externalQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostingFieldSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentIntakeRecord" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "source" "RecruitmentSource" NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processedStatus" "IntakeStatus" NOT NULL DEFAULT 'received',
    "errorMessage" TEXT,
    "candidateId" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentIntakeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentOAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "RecruitmentChannel" NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentOAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" DATE,
    "address" TEXT,
    "nationalId" TEXT,
    "source" "RecruitmentSource" NOT NULL,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "cvUrl" TEXT,
    "avatarUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateMeta" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "metaKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentApplication" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "pipelineStageId" TEXT NOT NULL,
    "status" "RecruitmentApplicationStatus" NOT NULL DEFAULT 'new',
    "rejectReason" TEXT,
    "withdrawReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "RecruitmentSource" NOT NULL,
    "sourceRef" TEXT,
    "assignedToId" TEXT,
    "hiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentPipelineStage" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentPipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentPostingActivity" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "applicationId" TEXT,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentPostingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentConnectorResponse" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "externalResponseId" TEXT NOT NULL,
    "applicationId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "responseData" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentConnectorResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "format" "InterviewFormat" NOT NULL DEFAULT 'video_call',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "meetingLink" TEXT,
    "interviewerIds" TEXT[],
    "status" "InterviewRoundStatus" NOT NULL DEFAULT 'scheduled',
    "result" "InterviewResult" NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "recommendation" TEXT,
    "scores" JSONB,
    "answers" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentOffer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "RecruitmentOfferStatus" NOT NULL DEFAULT 'draft',
    "offeredSalary" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "trialEndDate" DATE,
    "jobTitle" TEXT,
    "department" TEXT,
    "employmentType" "EmployeeType" NOT NULL,
    "benefits" JSONB,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferVersion" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "salary" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "changeReason" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundCheck" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "group" "BgcGroup" NOT NULL,
    "status" "BgcStatus" NOT NULL DEFAULT 'pending',
    "idVerified" BOOLEAN,
    "addressVerified" BOOLEAN,
    "criminalRecordCheck" BOOLEAN,
    "legalStatusCheck" BOOLEAN,
    "certificationVerified" BOOLEAN,
    "employmentHistoryVerified" BOOLEAN,
    "financialCheckCompleted" BOOLEAN,
    "creditScoreCheck" BOOLEAN,
    "completedAt" TIMESTAMP(3),
    "passedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "checkedById" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeContract_contractNumber_key" ON "EmployeeContract"("contractNumber");

-- CreateIndex
CREATE INDEX "EmployeeContract_employeeId_idx" ON "EmployeeContract"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeContract_status_endDate_idx" ON "EmployeeContract"("status", "endDate");

-- CreateIndex
CREATE INDEX "EmployeeContract_contractNumber_idx" ON "EmployeeContract"("contractNumber");

-- CreateIndex
CREATE INDEX "Employee_status_employeeType_idx" ON "Employee"("status", "employeeType");

-- CreateIndex
CREATE INDEX "Employee_deletedAt_idx" ON "Employee"("deletedAt");

-- CreateIndex
CREATE INDEX "Employee_status_deletedAt_idx" ON "Employee"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "Employee_lockedUntil_idx" ON "Employee"("lockedUntil");

-- CreateIndex
CREATE INDEX "Employee_failedLoginCount_idx" ON "Employee"("failedLoginCount");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_username_idx" ON "Employee"("username");

-- CreateIndex
CREATE INDEX "WorkingShift_isActive_idx" ON "WorkingShift"("isActive");

-- CreateIndex
CREATE INDEX "WorkingShift_createdById_idx" ON "WorkingShift"("createdById");

-- CreateIndex
CREATE INDEX "WeeklyScheduleTemplate_isActive_idx" ON "WeeklyScheduleTemplate"("isActive");

-- CreateIndex
CREATE INDEX "WeeklyScheduleTemplate_createdById_idx" ON "WeeklyScheduleTemplate"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScheduleTemplateWeek_templateId_weekIndex_key" ON "WeeklyScheduleTemplateWeek"("templateId", "weekIndex");

-- CreateIndex
CREATE INDEX "WeeklyScheduleTemplateDay_shiftId_idx" ON "WeeklyScheduleTemplateDay"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScheduleTemplateDay_weekId_dayOfWeek_key" ON "WeeklyScheduleTemplateDay"("weekId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ShiftSchedule_employeeId_validFrom_idx" ON "ShiftSchedule"("employeeId", "validFrom" DESC);

-- CreateIndex
CREATE INDEX "ShiftSchedule_validTo_idx" ON "ShiftSchedule"("validTo");

-- CreateIndex
CREATE INDEX "ShiftSchedule_createdById_idx" ON "ShiftSchedule"("createdById");

-- CreateIndex
CREATE INDEX "ShiftSchedule_templateId_idx" ON "ShiftSchedule"("templateId");

-- CreateIndex
CREATE INDEX "ShiftScheduleDay_shiftId_idx" ON "ShiftScheduleDay"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftScheduleDay_scheduleId_weekIndex_dayOfWeek_key" ON "ShiftScheduleDay"("scheduleId", "weekIndex", "dayOfWeek");

-- CreateIndex
CREATE INDEX "EmployeeShift_shiftId_assignedDate_idx" ON "EmployeeShift"("shiftId", "assignedDate");

-- CreateIndex
CREATE INDEX "EmployeeShift_status_assignedDate_idx" ON "EmployeeShift"("status", "assignedDate");

-- CreateIndex
CREATE INDEX "EmployeeShift_scheduleId_idx" ON "EmployeeShift"("scheduleId");

-- CreateIndex
CREATE INDEX "EmployeeShift_createdById_idx" ON "EmployeeShift"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeShift_employeeId_assignedDate_shiftId_key" ON "EmployeeShift"("employeeId", "assignedDate", "shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeShiftId_key" ON "AttendanceRecord"("employeeShiftId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_correctedByApplicationId_key" ON "AttendanceRecord"("correctedByApplicationId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_employeeId_date_idx" ON "AttendanceRecord"("employeeId", "date" DESC);

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_date_idx" ON "AttendanceRecord"("status", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RealShift_attendanceRecordId_key" ON "RealShift"("attendanceRecordId");

-- CreateIndex
CREATE INDEX "RealShift_employeeId_date_idx" ON "RealShift"("employeeId", "date" DESC);

-- CreateIndex
CREATE INDEX "RealShift_isMatched_date_idx" ON "RealShift"("isMatched", "date" DESC);

-- CreateIndex
CREATE INDEX "Application_employeeId_status_idx" ON "Application"("employeeId", "status");

-- CreateIndex
CREATE INDEX "Application_employeeId_startDate_idx" ON "Application"("employeeId", "startDate" DESC);

-- CreateIndex
CREATE INDEX "Application_status_type_idx" ON "Application"("status", "type");

-- CreateIndex
CREATE INDEX "Application_approvedById_idx" ON "Application"("approvedById");

-- CreateIndex
CREATE INDEX "Application_assignedToId_idx" ON "Application"("assignedToId");

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
CREATE INDEX "RegimeCategory_createdById_idx" ON "RegimeCategory"("createdById");

-- CreateIndex
CREATE INDEX "RegimeCategory_isDefault_idx" ON "RegimeCategory"("isDefault");

-- CreateIndex
CREATE INDEX "ApplicationRegimeDetail_regimeCategoryId_idx" ON "ApplicationRegimeDetail"("regimeCategoryId");

-- CreateIndex
CREATE INDEX "ApplicationLateEarlyDetail_employeeShiftId_idx" ON "ApplicationLateEarlyDetail"("employeeShiftId");

-- CreateIndex
CREATE INDEX "HolidayCalendar_date_idx" ON "HolidayCalendar"("date");

-- CreateIndex
CREATE INDEX "HolidayCalendar_type_date_idx" ON "HolidayCalendar"("type", "date");

-- CreateIndex
CREATE INDEX "HolidayCalendar_scope_date_idx" ON "HolidayCalendar"("scope", "date");

-- CreateIndex
CREATE INDEX "HolidayCalendar_positionId_idx" ON "HolidayCalendar"("positionId");

-- CreateIndex
CREATE INDEX "HolidayCalendar_batchId_idx" ON "HolidayCalendar"("batchId");

-- CreateIndex
CREATE INDEX "HolidayCalendar_createdById_idx" ON "HolidayCalendar"("createdById");

-- CreateIndex
CREATE INDEX "HolidayCalendarAssignee_employeeId_idx" ON "HolidayCalendarAssignee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_code_key" ON "SalaryComponent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_name_key" ON "SalaryComponent"("name");

-- CreateIndex
CREATE INDEX "SalaryComponent_type_isActive_idx" ON "SalaryComponent"("type", "isActive");

-- CreateIndex
CREATE INDEX "SalaryComponent_createdById_idx" ON "SalaryComponent"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PayslipTemplate_name_key" ON "PayslipTemplate"("name");

-- CreateIndex
CREATE INDEX "PayslipTemplate_isActive_idx" ON "PayslipTemplate"("isActive");

-- CreateIndex
CREATE INDEX "PayslipTemplate_createdById_idx" ON "PayslipTemplate"("createdById");

-- CreateIndex
CREATE INDEX "PayslipTemplateComponent_componentId_idx" ON "PayslipTemplateComponent"("componentId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_employeeId_effectiveFrom_idx" ON "EmployeeSalaryConfig"("employeeId", "effectiveFrom" DESC);

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_templateId_idx" ON "EmployeeSalaryConfig"("templateId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_effectiveTo_idx" ON "EmployeeSalaryConfig"("effectiveTo");

-- CreateIndex
CREATE INDEX "EmployeeSalaryConfig_createdById_idx" ON "EmployeeSalaryConfig"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryVariable_code_key" ON "SalaryVariable"("code");

-- CreateIndex
CREATE INDEX "SalaryVariable_isActive_idx" ON "SalaryVariable"("isActive");

-- CreateIndex
CREATE INDEX "SalaryVariable_createdById_idx" ON "SalaryVariable"("createdById");

-- CreateIndex
CREATE INDEX "PayrollSettings_updatedById_idx" ON "PayrollSettings"("updatedById");

-- CreateIndex
CREATE INDEX "WeeklyScheduleSettings_updatedById_idx" ON "WeeklyScheduleSettings"("updatedById");

-- CreateIndex
CREATE INDEX "PartTimeWeeklyAvailability_weekStart_idx" ON "PartTimeWeeklyAvailability"("weekStart");

-- CreateIndex
CREATE INDEX "PartTimeWeeklyAvailability_status_idx" ON "PartTimeWeeklyAvailability"("status");

-- CreateIndex
CREATE INDEX "PartTimeWeeklyAvailability_reviewedById_idx" ON "PartTimeWeeklyAvailability"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "PartTimeWeeklyAvailability_employeeId_weekStart_key" ON "PartTimeWeeklyAvailability"("employeeId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "PartTimeAvailabilityDay_availabilityId_dayOfWeek_key" ON "PartTimeAvailabilityDay"("availabilityId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "PartTimeAvailabilitySlot_dayId_idx" ON "PartTimeAvailabilitySlot"("dayId");

-- CreateIndex
CREATE INDEX "Payroll_status_idx" ON "Payroll"("status");

-- CreateIndex
CREATE INDEX "Payroll_approvedById_idx" ON "Payroll"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_periodYear_periodMonth_name_key" ON "Payroll"("periodYear", "periodMonth", "name");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_payrollId_idx" ON "Payslip"("employeeId", "payrollId" DESC);

-- CreateIndex
CREATE INDEX "Payslip_salaryConfigId_idx" ON "Payslip"("salaryConfigId");

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
CREATE INDEX "Task_projectId_statusId_idx" ON "Task"("projectId", "statusId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_status_idx" ON "Task"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- CreateIndex
CREATE INDEX "ActivityLog_employeeId_createdAt_idx" ON "ActivityLog"("employeeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_category_actionType_createdAt_idx" ON "ActivityLog"("category", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_category_idx" ON "ActivityLog"("category");

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

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_employeeId_idx" ON "RefreshToken"("employeeId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "SpentTime_taskId_idx" ON "SpentTime"("taskId");

-- CreateIndex
CREATE INDEX "SpentTime_employeeId_idx" ON "SpentTime"("employeeId");

-- CreateIndex
CREATE INDEX "SpentTime_status_date_idx" ON "SpentTime"("status", "date");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");

-- CreateIndex
CREATE INDEX "roles_deletedAt_idx" ON "roles"("deletedAt");

-- CreateIndex
CREATE INDEX "roles_isDefault_idx" ON "roles"("isDefault");

-- CreateIndex
CREATE INDEX "roles_isAdministrative_isActive_deletedAt_idx" ON "roles"("isAdministrative", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_deletedAt_idx" ON "permissions"("deletedAt");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "employee_roles_roleId_idx" ON "employee_roles"("roleId");

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
CREATE INDEX "CustomQuery_employeeId_type_idx" ON "CustomQuery"("employeeId", "type");

-- CreateIndex
CREATE INDEX "ProjectTaskStatus_projectId_idx" ON "ProjectTaskStatus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskStatus_projectId_name_key" ON "ProjectTaskStatus"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_roles_projectId_name_key" ON "project_roles"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_roles_projectId_code_key" ON "project_roles"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "project_trackers_projectId_name_key" ON "project_trackers"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_trackers_projectId_code_key" ON "project_trackers"("projectId", "code");

-- CreateIndex
CREATE INDEX "EmployeeLeaveBalance_employeeId_year_idx" ON "EmployeeLeaveBalance"("employeeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLeaveBalance_employeeId_year_key" ON "EmployeeLeaveBalance"("employeeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequisition_code_key" ON "JobRequisition"("code");

-- CreateIndex
CREATE INDEX "JobRequisition_status_idx" ON "JobRequisition"("status");

-- CreateIndex
CREATE INDEX "JobRequisition_requestedById_idx" ON "JobRequisition"("requestedById");

-- CreateIndex
CREATE INDEX "JobRequisition_approverId_idx" ON "JobRequisition"("approverId");

-- CreateIndex
CREATE INDEX "JobRequisition_positionId_idx" ON "JobRequisition"("positionId");

-- CreateIndex
CREATE INDEX "JobRequisition_department_idx" ON "JobRequisition"("department");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceCode_key" ON "JobPosting"("sourceCode");

-- CreateIndex
CREATE INDEX "JobPosting_requisitionId_idx" ON "JobPosting"("requisitionId");

-- CreateIndex
CREATE INDEX "JobPosting_channel_idx" ON "JobPosting"("channel");

-- CreateIndex
CREATE INDEX "JobPosting_source_idx" ON "JobPosting"("source");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_oauthAccountId_idx" ON "JobPosting"("oauthAccountId");

-- CreateIndex
CREATE INDEX "JobPosting_archivedById_idx" ON "JobPosting"("archivedById");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_id_requisitionId_key" ON "JobPosting"("id", "requisitionId");

-- CreateIndex
CREATE INDEX "CandidateFieldDefinition_requisitionId_idx" ON "CandidateFieldDefinition"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateFieldDefinition_requisitionId_key_key" ON "CandidateFieldDefinition"("requisitionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateFieldDefinition_requisitionId_position_key" ON "CandidateFieldDefinition"("requisitionId", "position");

-- CreateIndex
CREATE INDEX "PostingFieldSnapshot_postingId_idx" ON "PostingFieldSnapshot"("postingId");

-- CreateIndex
CREATE INDEX "PostingFieldSnapshot_externalQuestionId_idx" ON "PostingFieldSnapshot"("externalQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "PostingFieldSnapshot_postingId_fieldKey_key" ON "PostingFieldSnapshot"("postingId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "PostingFieldSnapshot_postingId_position_key" ON "PostingFieldSnapshot"("postingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentIntakeRecord_sourceRef_key" ON "RecruitmentIntakeRecord"("sourceRef");

-- CreateIndex
CREATE INDEX "RecruitmentIntakeRecord_postingId_idx" ON "RecruitmentIntakeRecord"("postingId");

-- CreateIndex
CREATE INDEX "RecruitmentIntakeRecord_processedStatus_idx" ON "RecruitmentIntakeRecord"("processedStatus");

-- CreateIndex
CREATE INDEX "RecruitmentOAuthAccount_userId_idx" ON "RecruitmentOAuthAccount"("userId");

-- CreateIndex
CREATE INDEX "RecruitmentOAuthAccount_channel_idx" ON "RecruitmentOAuthAccount"("channel");

-- CreateIndex
CREATE INDEX "Candidate_email_idx" ON "Candidate"("email");

-- CreateIndex
CREATE INDEX "Candidate_source_idx" ON "Candidate"("source");

-- CreateIndex
CREATE INDEX "CandidateMeta_metaKey_idx" ON "CandidateMeta"("metaKey");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateMeta_candidateId_metaKey_key" ON "CandidateMeta"("candidateId", "metaKey");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_requisitionId_candidateId_idx" ON "RecruitmentApplication"("requisitionId", "candidateId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_requisitionId_idx" ON "RecruitmentApplication"("requisitionId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_candidateId_idx" ON "RecruitmentApplication"("candidateId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_postingId_idx" ON "RecruitmentApplication"("postingId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_assignedToId_idx" ON "RecruitmentApplication"("assignedToId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_status_idx" ON "RecruitmentApplication"("status");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_pipelineStageId_idx" ON "RecruitmentApplication"("pipelineStageId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_postingId_pipelineStageId_idx" ON "RecruitmentApplication"("postingId", "pipelineStageId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_postingId_createdAt_idx" ON "RecruitmentApplication"("postingId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentPipelineStage_postingId_idx" ON "RecruitmentPipelineStage"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentPipelineStage_postingId_position_key" ON "RecruitmentPipelineStage"("postingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentPipelineStage_id_postingId_key" ON "RecruitmentPipelineStage"("id", "postingId");

-- CreateIndex
CREATE INDEX "RecruitmentPostingActivity_postingId_createdAt_idx" ON "RecruitmentPostingActivity"("postingId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentPostingActivity_applicationId_idx" ON "RecruitmentPostingActivity"("applicationId");

-- CreateIndex
CREATE INDEX "RecruitmentPostingActivity_actorId_idx" ON "RecruitmentPostingActivity"("actorId");

-- CreateIndex
CREATE INDEX "RecruitmentPostingActivity_type_idx" ON "RecruitmentPostingActivity"("type");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentConnectorResponse_applicationId_key" ON "RecruitmentConnectorResponse"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentConnectorResponse_postingId_externalResponseId_key" ON "RecruitmentConnectorResponse"("postingId", "externalResponseId");

-- CreateIndex
CREATE INDEX "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationNote_addedById_idx" ON "ApplicationNote"("addedById");

-- CreateIndex
CREATE INDEX "InterviewRound_applicationId_idx" ON "InterviewRound"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewRound_scheduledAt_idx" ON "InterviewRound"("scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewRound_status_idx" ON "InterviewRound"("status");

-- CreateIndex
CREATE INDEX "Scorecard_interviewId_idx" ON "Scorecard"("interviewId");

-- CreateIndex
CREATE INDEX "Scorecard_evaluatorId_idx" ON "Scorecard"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Scorecard_interviewId_evaluatorId_key" ON "Scorecard"("interviewId", "evaluatorId");

-- CreateIndex
CREATE INDEX "RecruitmentOffer_applicationId_idx" ON "RecruitmentOffer"("applicationId");

-- CreateIndex
CREATE INDEX "RecruitmentOffer_candidateId_idx" ON "RecruitmentOffer"("candidateId");

-- CreateIndex
CREATE INDEX "RecruitmentOffer_status_idx" ON "RecruitmentOffer"("status");

-- CreateIndex
CREATE INDEX "OfferVersion_offerId_idx" ON "OfferVersion"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferVersion_offerId_version_key" ON "OfferVersion"("offerId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundCheck_offerId_key" ON "BackgroundCheck"("offerId");

-- CreateIndex
CREATE INDEX "BackgroundCheck_candidateId_idx" ON "BackgroundCheck"("candidateId");

-- CreateIndex
CREATE INDEX "BackgroundCheck_status_idx" ON "BackgroundCheck"("status");

-- AddForeignKey
ALTER TABLE "EmployeeContract" ADD CONSTRAINT "EmployeeContract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContract" ADD CONSTRAINT "EmployeeContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContract" ADD CONSTRAINT "EmployeeContract_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContract" ADD CONSTRAINT "EmployeeContract_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "EmployeeContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_personalEmployeeId_fkey" FOREIGN KEY ("personalEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingShift" ADD CONSTRAINT "WorkingShift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplate" ADD CONSTRAINT "WeeklyScheduleTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplateWeek" ADD CONSTRAINT "WeeklyScheduleTemplateWeek_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WeeklyScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplateDay" ADD CONSTRAINT "WeeklyScheduleTemplateDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "WeeklyScheduleTemplateWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleTemplateDay" ADD CONSTRAINT "WeeklyScheduleTemplateDay_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkingShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WeeklyScheduleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_correctedByApplicationId_fkey" FOREIGN KEY ("correctedByApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealShift" ADD CONSTRAINT "RealShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealShift" ADD CONSTRAINT "RealShift_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_partnerApprovedById_fkey" FOREIGN KEY ("partnerApprovedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "RegimeCategory" ADD CONSTRAINT "RegimeCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRegimeDetail" ADD CONSTRAINT "ApplicationRegimeDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRegimeDetail" ADD CONSTRAINT "ApplicationRegimeDetail_regimeCategoryId_fkey" FOREIGN KEY ("regimeCategoryId") REFERENCES "RegimeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLateEarlyDetail" ADD CONSTRAINT "ApplicationLateEarlyDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLateEarlyDetail" ADD CONSTRAINT "ApplicationLateEarlyDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationBusinessTripDetail" ADD CONSTRAINT "ApplicationBusinessTripDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkFromHomeDetail" ADD CONSTRAINT "ApplicationWorkFromHomeDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationWorkFromHomeDetail" ADD CONSTRAINT "ApplicationWorkFromHomeDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendar" ADD CONSTRAINT "HolidayCalendar_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendar" ADD CONSTRAINT "HolidayCalendar_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendarAssignee" ADD CONSTRAINT "HolidayCalendarAssignee_holidayId_fkey" FOREIGN KEY ("holidayId") REFERENCES "HolidayCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendarAssignee" ADD CONSTRAINT "HolidayCalendarAssignee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplate" ADD CONSTRAINT "PayslipTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplateComponent" ADD CONSTRAINT "PayslipTemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PayslipTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplateComponent" ADD CONSTRAINT "PayslipTemplateComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryConfig" ADD CONSTRAINT "EmployeeSalaryConfig_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryConfig" ADD CONSTRAINT "EmployeeSalaryConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PayslipTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryConfig" ADD CONSTRAINT "EmployeeSalaryConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryVariable" ADD CONSTRAINT "SalaryVariable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettings" ADD CONSTRAINT "PayrollSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScheduleSettings" ADD CONSTRAINT "WeeklyScheduleSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeWeeklyAvailability" ADD CONSTRAINT "PartTimeWeeklyAvailability_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeWeeklyAvailability" ADD CONSTRAINT "PartTimeWeeklyAvailability_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeAvailabilityDay" ADD CONSTRAINT "PartTimeAvailabilityDay_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "PartTimeWeeklyAvailability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeAvailabilitySlot" ADD CONSTRAINT "PartTimeAvailabilitySlot_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "PartTimeAvailabilityDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_salaryConfigId_fkey" FOREIGN KEY ("salaryConfigId") REFERENCES "EmployeeSalaryConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipDetail" ADD CONSTRAINT "PayslipDetail_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipDetail" ADD CONSTRAINT "PayslipDetail_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "project_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "ProjectTaskStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpentTime" ADD CONSTRAINT "SpentTime_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpentTime" ADD CONSTRAINT "SpentTime_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpentTime" ADD CONSTRAINT "SpentTime_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorization_audit_logs" ADD CONSTRAINT "authorization_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorization_audit_logs" ADD CONSTRAINT "authorization_audit_logs_targetEmployeeId_fkey" FOREIGN KEY ("targetEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuery" ADD CONSTRAINT "CustomQuery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuery" ADD CONSTRAINT "CustomQuery_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskStatus" ADD CONSTRAINT "ProjectTaskStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_roles" ADD CONSTRAINT "project_roles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_trackers" ADD CONSTRAINT "project_trackers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveBalance" ADD CONSTRAINT "EmployeeLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationForgotCardDetail" ADD CONSTRAINT "ApplicationForgotCardDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationForgotCardDetail" ADD CONSTRAINT "ApplicationForgotCardDetail_employeeShiftId_fkey" FOREIGN KEY ("employeeShiftId") REFERENCES "EmployeeShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRecruitmentDetail" ADD CONSTRAINT "ApplicationRecruitmentDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_oauthAccountId_fkey" FOREIGN KEY ("oauthAccountId") REFERENCES "RecruitmentOAuthAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateFieldDefinition" ADD CONSTRAINT "CandidateFieldDefinition_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingFieldSnapshot" ADD CONSTRAINT "PostingFieldSnapshot_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentIntakeRecord" ADD CONSTRAINT "RecruitmentIntakeRecord_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentOAuthAccount" ADD CONSTRAINT "RecruitmentOAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateMeta" ADD CONSTRAINT "CandidateMeta_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "RecruitmentPipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPipelineStage" ADD CONSTRAINT "RecruitmentPipelineStage_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPostingActivity" ADD CONSTRAINT "RecruitmentPostingActivity_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPostingActivity" ADD CONSTRAINT "RecruitmentPostingActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPostingActivity" ADD CONSTRAINT "RecruitmentPostingActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentConnectorResponse" ADD CONSTRAINT "RecruitmentConnectorResponse_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentConnectorResponse" ADD CONSTRAINT "RecruitmentConnectorResponse_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentOffer" ADD CONSTRAINT "RecruitmentOffer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentOffer" ADD CONSTRAINT "RecruitmentOffer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentOffer" ADD CONSTRAINT "RecruitmentOffer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferVersion" ADD CONSTRAINT "OfferVersion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "RecruitmentOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "RecruitmentOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
