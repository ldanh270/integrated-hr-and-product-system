/** User-facing attendance errors — keep in sync with AttendanceService guard clauses. */
export const ATTENDANCE_ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  VALIDATION_ERROR: "Validation error",
  FORBIDDEN_EXPORT: "Forbidden: Only HR and Admins can export reports",
  SHIFT_NOT_FOUND: "Không tìm thấy ca làm việc cho hôm nay",
  NO_SCHEDULE_TODAY: "Hôm nay không có ca làm việc theo lịch",
  CHECK_IN_TOO_EARLY: "Chưa đến giờ check-in",
  CHECK_IN_TOO_LATE: "Đã quá giờ check-in",
  ALREADY_CHECKED_IN: "Đã check-in rồi",
  CHECK_OUT_TOO_EARLY: "Chưa đến giờ check-out",
  OUTSIDE_GPS_RADIUS: "Bạn đang ở ngoài phạm vi chấm công",
  CHECK_OUT_BEFORE_IN: "Cannot check out before check in",
  ALREADY_CHECKED_OUT: "Attendance already checked out",
  INVALID_DATE_FORMAT: "Invalid date format",
  SHIFT_TIME_FORMAT: "Format must be HH:mm",
  SHIFT_BREAK_PAIR_REQUIRED: "Break start and end time must be provided together",
  SHIFT_BREAK_OUTSIDE_SHIFT: "Break time must be fully inside the working shift",
  /** PT onsite: GPS check-in only after admin assigns a shift for today. */
  PT_NO_ASSIGNED_SHIFT:
    "Nhân viên part-time chưa được xếp ca hôm nay, không thể check-in/check-out",
} as const
