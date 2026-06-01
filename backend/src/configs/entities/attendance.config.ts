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

export const APPLICATION_TYPES = [
  "leave",
  "overtime",
  "work_from_home",
  "shift_swap",
  "business_trip",
  "maternity",
  "paternity",
  "sick",
] as const
export type IApplicationType = (typeof APPLICATION_TYPES)[number]

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
