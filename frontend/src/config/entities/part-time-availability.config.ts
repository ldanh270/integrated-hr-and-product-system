/** Lifecycle: draft → submitted → approved/rejected. Assign allowed when submitted (approval optional). */
export const PART_TIME_AVAILABILITY_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

export const PART_TIME_AVAILABILITY_STATUSES = [
  PART_TIME_AVAILABILITY_STATUS.DRAFT,
  PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  PART_TIME_AVAILABILITY_STATUS.APPROVED,
  PART_TIME_AVAILABILITY_STATUS.REJECTED,
] as const

export type IPartTimeAvailabilityStatus = (typeof PART_TIME_AVAILABILITY_STATUSES)[number]

// Cap free-time windows per day so scheduling stays readable.
export const PART_TIME_AVAILABILITY_RULES = {
  MAX_SLOTS_PER_DAY: 4,
  MIN_SLOT_DURATION_MINUTES: 30,
  DEFAULT_SLOT_START: "08:00",
  DEFAULT_SLOT_END: "17:00",
} as const

export const PART_TIME_AVAILABILITY_STATUS_LABELS: Record<IPartTimeAvailabilityStatus, string> = {
  draft: "Nháp",
  submitted: "Đã gửi",
  approved: "Đã duyệt",
  rejected: "Từ chối",
}

export const PART_TIME_AVAILABILITY_STATUS_VARIANTS: Record<
  IPartTimeAvailabilityStatus,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  draft: "neutral",
  submitted: "warning",
  approved: "success",
  rejected: "danger",
}

export function getPartTimeAvailabilityStatusLabel(status: IPartTimeAvailabilityStatus): string {
  switch (status) {
    case PART_TIME_AVAILABILITY_STATUS.DRAFT:
      return PART_TIME_AVAILABILITY_STATUS_LABELS.draft
    case PART_TIME_AVAILABILITY_STATUS.SUBMITTED:
      return PART_TIME_AVAILABILITY_STATUS_LABELS.submitted
    case PART_TIME_AVAILABILITY_STATUS.APPROVED:
      return PART_TIME_AVAILABILITY_STATUS_LABELS.approved
    case PART_TIME_AVAILABILITY_STATUS.REJECTED:
      return PART_TIME_AVAILABILITY_STATUS_LABELS.rejected
  }
}

export function getPartTimeAvailabilityStatusVariant(
  status: IPartTimeAvailabilityStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case PART_TIME_AVAILABILITY_STATUS.DRAFT:
      return PART_TIME_AVAILABILITY_STATUS_VARIANTS.draft
    case PART_TIME_AVAILABILITY_STATUS.SUBMITTED:
      return PART_TIME_AVAILABILITY_STATUS_VARIANTS.submitted
    case PART_TIME_AVAILABILITY_STATUS.APPROVED:
      return PART_TIME_AVAILABILITY_STATUS_VARIANTS.approved
    case PART_TIME_AVAILABILITY_STATUS.REJECTED:
      return PART_TIME_AVAILABILITY_STATUS_VARIANTS.rejected
  }
}

export const PART_TIME_AVAILABILITY_ACTION_LABELS = {
  SUBMIT: "Gửi lịch rảnh",
  UPDATE: "Cập nhật lịch rảnh",
  SUBMIT_SUCCESS: "Đã gửi lịch rảnh tuần này",
  UPDATE_SUCCESS: "Đã cập nhật lịch rảnh",
} as const

export const PART_TIME_AVAILABILITY_ASSIGN_LABELS = {
  WORK_DAY: "Làm",
  OFF_DAY: "Không làm",
  OFF_DAY_HINT: "Không xếp ca ngày này",
  FREE_RANGE_HINT: "Giờ làm phải nằm trong khung rảnh",
  ALL_BUSY_WEEK: "Nhân viên bận cả tuần — không thể xếp ca",
  CLEAR_WEEK_SUCCESS: "Đã xóa ca tuần này",
} as const

export const PART_TIME_AVAILABILITY_ASSIGN_VALIDATION = {
  INCOMPLETE: "Nhập đủ giờ bắt đầu và kết thúc",
  END_BEFORE_START: "Giờ kết thúc phải sau giờ bắt đầu",
  OUTSIDE_FREE_RANGE: "Giờ làm ngoài khung rảnh của nhân viên",
  CHECK_ASSIGNMENTS: "Kiểm tra lại khung giờ xếp ca",
} as const

export const PART_TIME_AVAILABILITY_FORM_VALIDATION = {
  BUSY_WITH_SLOTS: "Ngày bận cả ngày không được có khung giờ rảnh",
  EMPTY_DAY_SLOTS: "Phải khai báo khung rảnh hoặc đánh dấu bận cả ngày",
  SLOT_TOO_SHORT: "Mỗi khung rảnh phải dài ít nhất 30 phút",
  SLOT_OVERLAP: "Khung giờ trong cùng ngày không được chồng lấn",
  MAX_SLOTS: "Mỗi ngày tối đa 4 khung giờ rảnh",
  CHECK_FORM: "Kiểm tra lại lịch rảnh trước khi gửi",
} as const

/** Intended edit gate: draft/submitted/rejected only. Approved is optional review — assign does not require it. */
export const PART_TIME_AVAILABILITY_EDITABLE_STATUSES: IPartTimeAvailabilityStatus[] = [
  PART_TIME_AVAILABILITY_STATUS.DRAFT,
  PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  PART_TIME_AVAILABILITY_STATUS.REJECTED,
]

/** Admin may assign when submitted (primary) or legacy approved — approval is not required. */
export const PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES: IPartTimeAvailabilityStatus[] = [
  PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  PART_TIME_AVAILABILITY_STATUS.APPROVED,
]

export const PART_TIME_AVAILABILITY_QUERY_KEYS = {
  /** Scoped by weekStart so week navigation never reuses stale cache. */
  MINE: (weekStart: string) => ["part-time-availability", "mine", weekStart] as const,
  LIST: (weekStart: string) => ["part-time-availability", "list", weekStart] as const,
  EMPLOYEE: (employeeId: string, weekStart: string) =>
    ["part-time-availability", "employee", employeeId, weekStart] as const,
} as const
