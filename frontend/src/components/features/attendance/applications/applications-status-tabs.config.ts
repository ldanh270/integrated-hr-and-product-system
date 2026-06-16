import type { StatusFilter } from "@/hooks/application/useMyApplications"

export type StatusTabItem = {
  value: StatusFilter
  label: string
}

export const STATUS_TABS: readonly StatusTabItem[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
]
