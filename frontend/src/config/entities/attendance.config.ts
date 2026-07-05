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
  OVERTIME: { LABEL: "overtime", DESCRIPTION: "Tăng ca (OT)" },
  WORK_FROM_HOME: { LABEL: "work_from_home", DESCRIPTION: "Làm việc từ xa" },
  SHIFT_SWAP: { LABEL: "shift_swap", DESCRIPTION: "Đổi ca làm việc" },
  LATE_EARLY: { LABEL: "late_early", DESCRIPTION: "Đi muộn/về sớm" },
  RESIGNATION: { LABEL: "resignation", DESCRIPTION: "Thôi việc" },
} as const
export type IApplicationType = (typeof APPLICATION_TYPES)[keyof typeof APPLICATION_TYPES]["LABEL"]

export const APPLICATION_TYPE_VALUES = [
  APPLICATION_TYPES.LEAVE.LABEL,
  APPLICATION_TYPES.OVERTIME.LABEL,
  APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
  APPLICATION_TYPES.SHIFT_SWAP.LABEL,
  APPLICATION_TYPES.LATE_EARLY.LABEL,
  APPLICATION_TYPES.RESIGNATION.LABEL,
] as const

// Types that support batch (multi-item) submission — excludes resignation
export const BATCHABLE_APPLICATION_TYPES = [
  APPLICATION_TYPES.LEAVE.LABEL,
  APPLICATION_TYPES.OVERTIME.LABEL,
  APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
  APPLICATION_TYPES.SHIFT_SWAP.LABEL,
  APPLICATION_TYPES.LATE_EARLY.LABEL,
] as const
export type IBatchableApplicationType = (typeof BATCHABLE_APPLICATION_TYPES)[number]

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
export type IApplicationFilterStatus = IApplicationStatus | "all"

export const APPLICATION_FILTER = {
  ALL: "all",
} as const

export const PARTNER_APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const
export type IPartnerApprovalStatus = (typeof PARTNER_APPROVAL_STATUS)[keyof typeof PARTNER_APPROVAL_STATUS]

export const APPLICATION_VIEW_MODE = {
  MINE: "mine",
  MANAGE: "manage",
} as const
export type IApplicationViewMode = (typeof APPLICATION_VIEW_MODE)[keyof typeof APPLICATION_VIEW_MODE]

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

// ─── Label Maps ───────────────────────────────────────────────

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  [LEAVE_TYPE.ANNUAL_LEAVE]: "Nghỉ phép năm",
  [LEAVE_TYPE.SICK_LEAVE]: "Nghỉ ốm",
  [LEAVE_TYPE.MATERNITY_LEAVE]: "Nghỉ thai sản",
  [LEAVE_TYPE.BEREAVEMENT_LEAVE]: "Nghỉ tang chế",
  [LEAVE_TYPE.MARRIAGE_LEAVE]: "Nghỉ cưới",
  [LEAVE_TYPE.UNPAID_LEAVE]: "Nghỉ không lương",
  [LEAVE_TYPE.OTHER]: "Khác",
}

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
  overtime: "Tăng ca",
  work_from_home: "Làm từ xa",
  shift_swap: "Đổi ca",
  business_trip: "Công tác",
  late_early: "Đi muộn/Về sớm",
  regime: "Chế độ thai sản/bệnh",
  resignation: "Thôi việc",
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
}

export const APPLICATION_STATUS_INFO: Record<
  string,
  { label: string; colorClass: string }
> = {
  [APPLICATION_STATUS.PENDING]: { label: "Chờ duyệt", colorClass: "text-amber-600 border-amber-600 font-medium" },
  [APPLICATION_STATUS.APPROVED]: { label: "Đã duyệt", colorClass: "text-emerald-600 border-emerald-600 font-medium" },
  [APPLICATION_STATUS.REJECTED]: { label: "Không duyệt", colorClass: "text-red-600 border-red-600 font-medium" },
  [APPLICATION_STATUS.CANCELLED]: { label: "Đã hủy", colorClass: "text-slate-500 border-slate-500 font-medium" },
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

/** Vietnamese display labels for holiday type enums. */
export const HOLIDAY_TYPE_LABELS = new Map<IHolidayType, string>([
  ["national", "Ngày lễ quốc gia"],
  ["company", "Ngày nghỉ công ty"],
])

export const UNKNOWN_HOLIDAY_TYPE_LABEL = "Ngày nghỉ"

/** Vietnamese display labels keyed by zero-based month index. */
export const MONTH_LABELS = new Map<number, string>([
  [0, "Tháng 1"],
  [1, "Tháng 2"],
  [2, "Tháng 3"],
  [3, "Tháng 4"],
  [4, "Tháng 5"],
  [5, "Tháng 6"],
  [6, "Tháng 7"],
  [7, "Tháng 8"],
  [8, "Tháng 9"],
  [9, "Tháng 10"],
  [10, "Tháng 11"],
  [11, "Tháng 12"],
])

export const UNKNOWN_MONTH_LABEL = "Tháng không hợp lệ"

export const DAY_OF_WEEK_LABELS = new Map<number, string>([
  [0, "CN"],
  [1, "T2"],
  [2, "T3"],
  [3, "T4"],
  [4, "T5"],
  [5, "T6"],
  [6, "T7"],
])

export const DAY_OF_WEEK_FULL_LABELS = new Map<number, string>([
  [0, "Chủ Nhật"],
  [1, "Thứ Hai"],
  [2, "Thứ Ba"],
  [3, "Thứ Tư"],
  [4, "Thứ Năm"],
  [5, "Thứ Sáu"],
  [6, "Thứ Bảy"],
])

export const UNKNOWN_DAY_OF_WEEK_LABEL = "Không xác định"

/** 0 = Sunday … 6 = Saturday (matches JS Date#getDay). */
export const DAY_OF_WEEK_VALUES = [0, 1, 2, 3, 4, 5, 6] as const
export type IDayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number]

/** Mon → Sun display order for weekly schedule editors. */
export const WORK_WEEK_DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

/** Select sentinel when a template day has no assigned shift. */
export const WEEKLY_SCHEDULE_OFF_SHIFT_VALUE = "__off__"

/** Profile link: use the signed-in account as the attendance employee. */
export const PERSONAL_EMPLOYEE_LINK_SELF = "self"

export const WEEKLY_SCHEDULE_QUERY_KEYS = {
  SETTINGS: ["weekly-schedule-settings"] as const,
} as const

export const WEEKLY_SCHEDULE_SETTINGS_FIELDS = [
  "triggerDayOfWeek",
  "triggerHour",
  "triggerMinute",
] as const

export function getDayOfWeekFullLabel(dayOfWeek: number) {
  return DAY_OF_WEEK_FULL_LABELS.get(dayOfWeek) ?? UNKNOWN_DAY_OF_WEEK_LABEL
}
