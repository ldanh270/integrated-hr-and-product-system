export const ATTENDANCE_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FORBIDDEN: "FORBIDDEN",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  NOT_FOUND: "NOT_FOUND",
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
