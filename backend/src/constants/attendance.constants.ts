export const ATTENDANCE_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FORBIDDEN: "FORBIDDEN",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  NOT_FOUND: "NOT_FOUND",
} as const

export const ATTENDANCE_ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  VALIDATION_ERROR: "Validation error",
  FORBIDDEN_EXPORT: "Forbidden: Only HR and Admins can export reports",
  SHIFT_NOT_FOUND: "No shift assignment found for today",
  CHECK_OUT_BEFORE_IN: "Cannot check out before check in",
  ALREADY_CHECKED_OUT: "Attendance already checked out",
  INVALID_DATE_FORMAT: "Invalid date format",
} as const

export const ATTENDANCE_LAYERS = {
  SERVICE: "AttendanceService",
  CONTROLLER: "AttendanceController",
  REPOSITORY: "AttendanceRepository",
} as const

export const ATTENDANCE_REPORT_HEADERS = [
  "Date",
  "Employee Name",
  "Employee ID",
  "Email",
  "Shift Name",
  "Scheduled Hours",
  "Check In",
  "Check Out",
  "Status",
  "Late (min)",
  "Early Leave (min)",
  "Overtime (min)",
  "Total Work (min)",
] as const
