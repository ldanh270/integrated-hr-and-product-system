import {
  SPENT_TIME_STATUS,
  SPENT_TIME_STATUSES,
  getSpentTimeStatusLabel,
} from "@/config/entities/project.config"
import type { SpentTimeStatus } from "@/types/spent-time.types"

/** UI filter value for showing all spent-time statuses in project tab. */
export const SPENT_TIME_FILTER = {
  ALL: "all",
} as const

export type SpentTimeFilterValue = SpentTimeStatus | typeof SPENT_TIME_FILTER.ALL

export const SPENT_TIME_STATUS_PILL_VARIANT = {
  APPROVED: "success",
  REJECTED: "danger",
  PENDING: "warning",
} as const

export type SpentTimeStatusPillVariant =
  (typeof SPENT_TIME_STATUS_PILL_VARIANT)[keyof typeof SPENT_TIME_STATUS_PILL_VARIANT]

export const SPENT_TIME_UI = {
  FILTER_ALL_LABEL: "Tất cả",
  TAB_TITLE: "Duyệt giờ làm việc (Spent Time)",
  BULK_APPROVE_PREFIX: "Duyệt tất cả",
  EMPTY_PROJECT_LIST: "Không có bản ghi giờ làm việc nào.",
  APPROVE_ACTION_TITLE: "Duyệt",
  REJECT_ACTION_TITLE: "Từ chối",
  REJECT_REASON_PROMPT: "Lý do từ chối:",
  TOAST_APPROVED: "Đã duyệt giờ làm việc",
  TOAST_REJECTED: "Đã từ chối giờ làm việc",
  TOAST_BULK_APPROVED: "Đã duyệt tất cả giờ chờ duyệt",
  TABLE_EMPLOYEE: "Nhân viên",
  TABLE_TASK: "Công việc",
  TABLE_DATE: "Ngày",
  TABLE_HOURS: "Giờ",
  TABLE_STATUS: "Trạng thái",
  TABLE_ACTIONS: "Thao tác",
  EMPTY_CELL: "—",
  TASK_SECTION_TITLE: "Spent Time",
  TASK_HOURS_SUFFIX: "giờ",
  TASK_EMPTY_LIST: "Chưa có thời gian làm việc nào được ghi nhận.",
  TASK_TOAST_APPROVED: "Đã duyệt Spent Time",
  TASK_TOAST_REJECTED: "Đã từ chối Spent Time",
  TASK_DELETE_CONFIRM: "Bạn có chắc chắn muốn xóa nhật ký này?",
  TASK_HOURS_BADGE_SUFFIX: "h",
} as const

export function getSpentTimeStatusPillVariant(status: SpentTimeStatus): SpentTimeStatusPillVariant {
  switch (status) {
    case SPENT_TIME_STATUS.APPROVED:
      return SPENT_TIME_STATUS_PILL_VARIANT.APPROVED
    case SPENT_TIME_STATUS.REJECTED:
      return SPENT_TIME_STATUS_PILL_VARIANT.REJECTED
    default:
      return SPENT_TIME_STATUS_PILL_VARIANT.PENDING
  }
}

export function buildSpentTimeFilterOptions(): { value: SpentTimeFilterValue; label: string }[] {
  return [
    { value: SPENT_TIME_FILTER.ALL, label: SPENT_TIME_UI.FILTER_ALL_LABEL },
    ...SPENT_TIME_STATUSES.map((status) => ({
      value: status,
      label: getSpentTimeStatusLabel(status),
    })),
  ]
}

export function formatBulkApproveLabel(count: number): string {
  return `${SPENT_TIME_UI.BULK_APPROVE_PREFIX} (${count})`
}
