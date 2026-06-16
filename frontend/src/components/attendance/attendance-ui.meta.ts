import React from "react"

import {
  Calendar,
  CalendarClock,
  Clock,
  FileCheck2,
  FileX2,
  Hourglass,
  Laptop,
  Repeat2,
} from "lucide-react"

export const APP_TYPE_META: Record<
  string,
  {
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    color: string
    bg: string
    border: string
    hint: string
  }
> = {
  leave: {
    label: "Nghỉ phép",
    icon: Calendar,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    hint: "Xin nghỉ phép năm, thai sản, ốm...",
  },
  overtime: {
    label: "Tăng ca",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
    hint: "Đăng ký tăng ca ngoài ca",
  },
  work_from_home: {
    label: "WFH",
    icon: Laptop,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    hint: "Làm việc từ xa / tại nhà",
  },
  shift_swap: {
    label: "Đổi ca",
    icon: Repeat2,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    hint: "Đề xuất đổi ca với đồng nghiệp",
  },

  late_early: {
    label: "Đi muộn/Về sớm",
    icon: CalendarClock,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    hint: "Thông báo đi muộn hoặc về sớm",
  },
}

export const STATUS_META: Record<
  string,
  {
    label: string
    color: string
    bg: string
    border: string
    icon: React.FC<{ size?: number }>
  }
> = {
  pending: {
    label: "Chờ duyệt",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Hourglass,
  },
  approved: {
    label: "Đã duyệt",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: FileCheck2,
  },
  rejected: {
    label: "Từ chối",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: FileX2,
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: FileX2,
  },
}

/** Correct leave type values matching backend LEAVE_TYPE_VALUES enum */
export const LEAVE_TYPE_OPTIONS = [
  { value: "annual_leave", label: "Nghỉ phép năm" },
  { value: "sick_leave", label: "Nghỉ ốm" },
  { value: "maternity_leave", label: "Thai sản" },
  { value: "bereavement_leave", label: "Nghỉ tang" },
  { value: "marriage_leave", label: "Nghỉ cưới" },
  { value: "unpaid_leave", label: "Nghỉ không lương" },
  { value: "other", label: "Khác" },
] as const

export const REGIME_TYPE_OPTIONS = [
  { value: "paid", label: "Có hưởng lương" },
  { value: "unpaid", label: "Không lương" },
] as const
