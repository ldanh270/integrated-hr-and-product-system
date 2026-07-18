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

export const HOLIDAY_TYPE = {
  NATIONAL: "national",
  COMPANY: "company",
} as const
export const HOLIDAY_TYPES = [HOLIDAY_TYPE.NATIONAL, HOLIDAY_TYPE.COMPANY] as const
export type IHolidayType = (typeof HOLIDAY_TYPES)[number]

/** Who the holiday applies to — all staff, one position, or hand-picked employees. */
export const HOLIDAY_SCOPE = {
  ALL: "all",
  POSITION: "position",
  EMPLOYEES: "employees",
} as const

export const HOLIDAY_SCOPE_VALUES = [
  HOLIDAY_SCOPE.ALL,
  HOLIDAY_SCOPE.POSITION,
  HOLIDAY_SCOPE.EMPLOYEES,
] as const

export type IHolidayScope = (typeof HOLIDAY_SCOPE_VALUES)[number]

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

/** Supported aggregation periods for the workforce attendance matrix. */
export const ATTENDANCE_MATRIX_VIEW = {
  WEEK: "week",
  MONTH: "month",
} as const

export const ATTENDANCE_MATRIX_VIEW_VALUES = [
  ATTENDANCE_MATRIX_VIEW.WEEK,
  ATTENDANCE_MATRIX_VIEW.MONTH,
] as const

export type IAttendanceMatrixView = (typeof ATTENDANCE_MATRIX_VIEW_VALUES)[number]

/** Check-in timing relative to the scheduled shift start. */
export const CHECK_IN_VARIANCE_STATUS = {
  EARLY: "early",
  ON_TIME: "on_time",
  LATE: "late",
  UNAVAILABLE: "unavailable",
} as const

export const CHECK_IN_VARIANCE_STATUS_VALUES = [
  CHECK_IN_VARIANCE_STATUS.EARLY,
  CHECK_IN_VARIANCE_STATUS.ON_TIME,
  CHECK_IN_VARIANCE_STATUS.LATE,
  CHECK_IN_VARIANCE_STATUS.UNAVAILABLE,
] as const

export type ICheckInVarianceStatus = (typeof CHECK_IN_VARIANCE_STATUS_VALUES)[number]

export const APPLICATION_TYPES = {
  LEAVE: { LABEL: "leave", DESCRIPTION: "Xin nghỉ phép" },
  OVERTIME: { LABEL: "overtime", DESCRIPTION: "Làm thêm giờ (OT)" },
  WORK_FROM_HOME: { LABEL: "work_from_home", DESCRIPTION: "Làm việc từ xa (WFH)" },
  SHIFT_SWAP: { LABEL: "shift_swap", DESCRIPTION: "Đổi ca làm việc" },
  LATE_EARLY: { LABEL: "late_early", DESCRIPTION: "Đi muộn/về sớm" },
  RESIGNATION: { LABEL: "resignation", DESCRIPTION: "Thôi việc" },
  FORGOT_CARD: { LABEL: "forgot_card", DESCRIPTION: "Quên chấm công" },
  REGIME: { LABEL: "regime", DESCRIPTION: "Đơn chế độ" },
  RECRUITMENT: { LABEL: "recruitment", DESCRIPTION: "Đề xuất tuyển dụng" },
} as const
export type IApplicationType = (typeof APPLICATION_TYPES)[keyof typeof APPLICATION_TYPES]["LABEL"]

export const APPLICATION_TYPE_VALUES = [
  APPLICATION_TYPES.LEAVE.LABEL,
  APPLICATION_TYPES.OVERTIME.LABEL,
  APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
  APPLICATION_TYPES.SHIFT_SWAP.LABEL,
  APPLICATION_TYPES.LATE_EARLY.LABEL,
  APPLICATION_TYPES.RESIGNATION.LABEL,
  APPLICATION_TYPES.FORGOT_CARD.LABEL,
  APPLICATION_TYPES.REGIME.LABEL,
  APPLICATION_TYPES.RECRUITMENT.LABEL,
] as const

export const APPLICATION_STATUS = {
  PENDING: "pending",
  PARTNER_PENDING: "partner_pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const

export const APPLICATION_STATUSES = [
  APPLICATION_STATUS.PENDING,
  APPLICATION_STATUS.PARTNER_PENDING,
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

/** System regime categories seeded lazily for every installation. */
export const DEFAULT_REGIME_CATEGORIES = [
  { NAME: "Có lương", MAX_LATE_MINUTES: 40, MAX_EARLY_MINUTES: 40 },
  { NAME: "Không lương", MAX_LATE_MINUTES: 0, MAX_EARLY_MINUTES: 0 },
] as const

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

/** Weekly Schedule Copilot — attendance pattern insights + template suggest/simulate. */
export const SCHEDULE_INSIGHTS = {
  DEFAULT_LOOKBACK_DAYS: 90,
  MIN_LOOKBACK_DAYS: 7,
  MAX_LOOKBACK_DAYS: 180,
  HOTSPOT_LIMIT: 3,
  LOOKBACK_QUERY_PARAM: "lookbackDays",
  LATE_RATE_THRESHOLD: 0.1,
  ABSENT_RATE_THRESHOLD: 0.08,
  WORK_DAYS: [1, 2, 3, 4, 5] as const,
  CANDIDATE_LIMIT: 2,
  RATE_PRECISION: 3,
  TEMPLATE_BASE_SCORE: 88,
  LATE_RISK_PENALTY: 25,
  ABSENCE_RISK_PENALTY: 20,
  MIN_COVERAGE_SCORE: 40,
  MAX_COVERAGE_SCORE: 99,
  MIN_SIMULATION_WEEKS: 1,
  MAX_SIMULATION_WEEKS: 8,
  DEFAULT_SIMULATION_WEEKS: 4,
  WEEK_END_OFFSET_DAYS: 6,
  DEFAULT_GRACE_PERIOD_MINUTES: 0,
} as const
export const SCHEDULE_VALIDATION_MESSAGES = {
  WEEK_START_REQUIRED: "weekStart is required",
} as const

/** Short day labels for insights API (0=CN … 6=T7). */
export const DAY_OF_WEEK_SHORT_LABELS: Record<number, string> = {
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
