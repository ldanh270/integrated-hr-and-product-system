export const EMPLOYEE_SHIFT_STATUS = {
  SCHEDULED: "scheduled",
  HOLIDAY_PENDING: "holiday_pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
} as const

export const EMPLOYEE_SHIFT_STATUSES = [
  EMPLOYEE_SHIFT_STATUS.SCHEDULED,
  EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING,
  EMPLOYEE_SHIFT_STATUS.CONFIRMED,
  EMPLOYEE_SHIFT_STATUS.CANCELLED,
] as const
export type IEmployeeShiftStatus = (typeof EMPLOYEE_SHIFT_STATUSES)[number]

export const HOLIDAY_TYPES = ["national", "company"] as const
export type IHolidayType = (typeof HOLIDAY_TYPES)[number]

export const ATTENDANCE_STATUS = {
  ON_TIME: "on_time",
  LATE: "late",
  EARLY_LEAVE: "early_leave",
  ABSENT: "absent",
  OVERTIME: "overtime",
} as const

export const ATTENDANCE_STATUSES = [
  ATTENDANCE_STATUS.ON_TIME,
  ATTENDANCE_STATUS.LATE,
  ATTENDANCE_STATUS.EARLY_LEAVE,
  ATTENDANCE_STATUS.ABSENT,
  ATTENDANCE_STATUS.OVERTIME,
] as const
export type IAttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const APPLICATION_TYPES = {
  LEAVE: { LABEL: "leave", DESCRIPTION: "Xin nghỉ phép" },
  OVERTIME: { LABEL: "overtime", DESCRIPTION: "Làm thêm giờ (OT)" },
  WORK_FROM_HOME: { LABEL: "work_from_home", DESCRIPTION: "Làm việc từ xa (WFH)" },
  SHIFT_SWAP: { LABEL: "shift_swap", DESCRIPTION: "Đổi ca làm việc" },
  BUSINESS_TRIP: { LABEL: "business_trip", DESCRIPTION: "Công tác" },
  LATE_EARLY: { LABEL: "late_early", DESCRIPTION: "Đi muộn/về sớm" },
  REGIME: { LABEL: "regime", DESCRIPTION: "Chế độ thai sản/bệnh" },
  RESIGNATION: { LABEL: "resignation", DESCRIPTION: "Thôi việc" },
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
  APPLICATION_TYPES.RESIGNATION.LABEL,
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

export const REGIME_TYPE = {
  PAID: "paid",
  UNPAID: "unpaid",
} as const

export const REGIME_TYPES = [REGIME_TYPE.PAID, REGIME_TYPE.UNPAID] as const
export type IRegimeType = (typeof REGIME_TYPES)[number]

export const LEAVE_TYPE = {
  ANNUAL_LEAVE: "annual_leave",
  SICK_LEAVE: "sick_leave",
  MATERNITY_LEAVE: "maternity_leave",
  BEREAVEMENT_LEAVE: "bereavement_leave",
  MARRIAGE_LEAVE: "marriage_leave",
  UNPAID_LEAVE: "unpaid_leave",
  OTHER: "other",
} as const

export const LEAVE_TYPE_VALUES = [
  LEAVE_TYPE.ANNUAL_LEAVE,
  LEAVE_TYPE.SICK_LEAVE,
  LEAVE_TYPE.MATERNITY_LEAVE,
  LEAVE_TYPE.BEREAVEMENT_LEAVE,
  LEAVE_TYPE.MARRIAGE_LEAVE,
  LEAVE_TYPE.UNPAID_LEAVE,
  LEAVE_TYPE.OTHER,
] as const
export type ILeaveType = (typeof LEAVE_TYPE_VALUES)[number]

// Leave types that consume from paid leave balance
export const PAID_LEAVE_TYPES: ILeaveType[] = [
  LEAVE_TYPE.ANNUAL_LEAVE,
  LEAVE_TYPE.SICK_LEAVE,
  LEAVE_TYPE.BEREAVEMENT_LEAVE,
  LEAVE_TYPE.MARRIAGE_LEAVE,
]

// Leave balance quota (working days per year) — configurable
export const LEAVE_BALANCE_DEFAULTS: Record<ILeaveType, number> = {
  annual_leave: 12,
  sick_leave: 30,
  maternity_leave: 180,
  bereavement_leave: 3,
  marriage_leave: 3,
  unpaid_leave: 0, // unlimited (no balance check)
  other: 0, // unlimited
}

/** 0 = Sunday … 6 = Saturday (matches JS Date#getDay). */
export const DAY_OF_WEEK_VALUES = [0, 1, 2, 3, 4, 5, 6] as const
export type IDayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number]

export const WEEKLY_SCHEDULE_SETTINGS_ID = "GLOBAL" as const

export const WEEKLY_SCHEDULE_DEFAULTS = {
  TRIGGER_DAY_OF_WEEK: 1,
  TRIGGER_HOUR: 7,
  TRIGGER_MINUTE: 0,
} as const

export const ATTENDANCE_QUERY_PARAMS = {
  START_DATE: "startDate",
  END_DATE: "endDate",
  EMPLOYEE_ID: "employeeId",
  STATUS: "status",
  PERSONAL_ONLY: "personalOnly",
} as const
