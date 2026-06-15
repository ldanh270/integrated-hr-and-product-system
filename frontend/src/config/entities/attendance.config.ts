export const EMPLOYEE_SHIFT_STATUSES = [
  "scheduled",
  "holiday_pending",
  "confirmed",
  "cancelled",
] as const
export type IEmployeeShiftStatus = (typeof EMPLOYEE_SHIFT_STATUSES)[number]

export const HOLIDAY_TYPES = ["national", "company"] as const
export type IHolidayType = (typeof HOLIDAY_TYPES)[number]

export const ATTENDANCE_STATUSES = ["on_time", "late", "early_leave", "absent", "overtime"] as const
export type IAttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const APPLICATION_TYPES = {
  LEAVE: { LABEL: "leave", DESCRIPTION: "Xin nghỉ phép" },
  OVERTIME: { LABEL: "overtime", DESCRIPTION: "Làm thêm giờ (OT)" },
  WORK_FROM_HOME: { LABEL: "work_from_home", DESCRIPTION: "Làm việc từ xa (WFH)" },
  SHIFT_SWAP: { LABEL: "shift_swap", DESCRIPTION: "Đổi ca làm việc" },
  BUSINESS_TRIP: { LABEL: "business_trip", DESCRIPTION: "Công tác" },
  LATE_EARLY: { LABEL: "late_early", DESCRIPTION: "Đi muộn/về sớm" },
  REGIME: { LABEL: "regime", DESCRIPTION: "Chế độ thai sản/bệnh" },
} as const
export type IApplicationType = (typeof APPLICATION_TYPES)[keyof typeof APPLICATION_TYPES]["LABEL"]

export const APPLICATION_TYPE_VALUES = [
  APPLICATION_TYPES.LEAVE.LABEL,
  APPLICATION_TYPES.OVERTIME.LABEL,
  APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
  APPLICATION_TYPES.SHIFT_SWAP.LABEL,
  APPLICATION_TYPES.BUSINESS_TRIP.LABEL,
  APPLICATION_TYPES.LATE_EARLY.LABEL,
  APPLICATION_TYPES.REGIME.LABEL,
] as const

export const APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const

export const APPLICATION_STATUSES = [
  APPLICATION_STATUS.PENDING,
  APPLICATION_STATUS.APPROVED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.CANCELLED,
] as const
export type IApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const REGIME_TYPES = ["paid", "unpaid"] as const
export type IRegimeType = (typeof REGIME_TYPES)[number]

// ─── Label Maps ───────────────────────────────────────────────

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  on_time: "Đúng giờ",
  late: "Đi muộn",
  early_leave: "Về sớm",
  absent: "Vắng mặt",
  overtime: "Tăng ca",
}

export const ATTENDANCE_STATUS_VARIANTS: Record<
  string,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  on_time: "success",
  late: "warning",
  early_leave: "warning",
  absent: "danger",
  overtime: "info",
}

export const APPLICATION_TYPE_LABELS: Record<string, string> = {
  leave: "Nghỉ phép",
  overtime: "Làm thêm giờ",
  work_from_home: "Làm từ xa",
  shift_swap: "Đổi ca",
  business_trip: "Công tác",
  late_early: "Đi muộn/Về sớm",
  regime: "Chế độ thai sản/bệnh",
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
}

export const APPLICATION_STATUS_VARIANTS: Record<
  string,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
}

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
}

export const DAY_OF_WEEK_FULL_LABELS: Record<number, string> = {
  0: "Chủ Nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
}

export function getDayOfWeekFullLabel(dayOfWeek: number) {
  switch (dayOfWeek) {
    case 0:
      return "Chủ Nhật"
    case 1:
      return "Thứ Hai"
    case 2:
      return "Thứ Ba"
    case 3:
      return "Thứ Tư"
    case 4:
      return "Thứ Năm"
    case 5:
      return "Thứ Sáu"
    case 6:
      return "Thứ Bảy"
    default:
      return "Không xác định"
  }
}
