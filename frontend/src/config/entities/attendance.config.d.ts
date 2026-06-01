export declare const EMPLOYEE_SHIFT_STATUSES: readonly [
  "scheduled",
  "holiday_pending",
  "confirmed",
  "cancelled",
]
export type IEmployeeShiftStatus = (typeof EMPLOYEE_SHIFT_STATUSES)[number]
export declare const HOLIDAY_TYPES: readonly ["national", "company"]
export type IHolidayType = (typeof HOLIDAY_TYPES)[number]
export declare const ATTENDANCE_STATUSES: readonly [
  "on_time",
  "late",
  "early_leave",
  "absent",
  "overtime",
]
export type IAttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]
export declare const APPLICATION_TYPES: readonly [
  "leave",
  "overtime",
  "work_from_home",
  "shift_swap",
  "business_trip",
  "maternity",
  "paternity",
  "sick",
]
export type IApplicationType = (typeof APPLICATION_TYPES)[number]
export declare const APPLICATION_STATUS: {
  readonly PENDING: "pending"
  readonly APPROVED: "approved"
  readonly REJECTED: "rejected"
  readonly CANCELLED: "cancelled"
}
export declare const APPLICATION_STATUSES: readonly ["pending", "approved", "rejected", "cancelled"]
export type IApplicationStatus = (typeof APPLICATION_STATUSES)[number]
export declare const REGIME_TYPES: readonly ["paid", "unpaid"]
export type IRegimeType = (typeof REGIME_TYPES)[number]
