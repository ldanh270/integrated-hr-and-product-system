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
  MATERNITY: { LABEL: "maternity", DESCRIPTION: "Nghỉ thai sản" },
  PATERNITY: { LABEL: "paternity", DESCRIPTION: "Nghỉ thai sản (nam)" },
  SICK: { LABEL: "sick", DESCRIPTION: "Nghỉ ốm" },
} as const
export type IApplicationType = (typeof APPLICATION_TYPES)[keyof typeof APPLICATION_TYPES]["LABEL"]

export const APPLICATION_TYPE_VALUES = [
  APPLICATION_TYPES.LEAVE.LABEL,
  APPLICATION_TYPES.OVERTIME.LABEL,
  APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
  APPLICATION_TYPES.SHIFT_SWAP.LABEL,
  APPLICATION_TYPES.BUSINESS_TRIP.LABEL,
  APPLICATION_TYPES.MATERNITY.LABEL,
  APPLICATION_TYPES.PATERNITY.LABEL,
  APPLICATION_TYPES.SICK.LABEL,
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
