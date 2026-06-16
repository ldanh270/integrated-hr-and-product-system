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
  SHIFT_NOT_FOUND: "Không tìm thấy ca làm việc cho hôm nay",
  CHECK_IN_TOO_EARLY: "Chưa đến giờ check-in",
  CHECK_IN_TOO_LATE: "Đã quá giờ check-in",
  ALREADY_CHECKED_IN: "Đã check-in rồi",
  CHECK_OUT_TOO_EARLY: "Chưa đến giờ check-out",
  OUTSIDE_GPS_RADIUS: "Bạn đang ở ngoài phạm vi chấm công",
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
