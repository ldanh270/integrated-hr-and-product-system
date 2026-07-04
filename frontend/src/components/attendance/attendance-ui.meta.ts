import React from "react"

import { APPLICATION_TYPES, LEAVE_TYPE } from "@/config/entities/attendance.config"

import {
  Calendar,
  CalendarClock,
  Clock,
  FileCheck2,
  FileX2,
  Hourglass,
  Laptop,
  Repeat2,
  UserMinus,
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
  [APPLICATION_TYPES.LEAVE.LABEL]: {
    label: "Nghỉ phép",
    icon: Calendar,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    hint: "Xin nghỉ phép năm, thai sản, ốm...",
  },
  [APPLICATION_TYPES.OVERTIME.LABEL]: {
    label: "Tăng ca",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hint: "Đăng ký tăng ca ngoài ca",
  },
  [APPLICATION_TYPES.WORK_FROM_HOME.LABEL]: {
    label: "Làm việc từ xa",
    icon: Laptop,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    hint: "Làm việc từ xa / tại nhà",
  },
  [APPLICATION_TYPES.SHIFT_SWAP.LABEL]: {
    label: "Đổi ca",
    icon: Repeat2,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    hint: "Đề xuất đổi ca với đồng nghiệp",
  },
  [APPLICATION_TYPES.LATE_EARLY.LABEL]: {
    label: "Đi muộn/Về sớm",
    icon: CalendarClock,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    hint: "Thông báo đi muộn hoặc về sớm",
  },

  [APPLICATION_TYPES.RESIGNATION.LABEL]: {
    label: "Thôi việc",
    icon: UserMinus,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    hint: "Thông báo xin nghỉ việc",
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
  { value: LEAVE_TYPE.ANNUAL_LEAVE, label: "Nghỉ phép năm" },
  { value: LEAVE_TYPE.SICK_LEAVE, label: "Nghỉ ốm" },
  { value: LEAVE_TYPE.MATERNITY_LEAVE, label: "Thai sản" },
  { value: LEAVE_TYPE.BEREAVEMENT_LEAVE, label: "Nghỉ tang" },
  { value: LEAVE_TYPE.MARRIAGE_LEAVE, label: "Nghỉ cưới" },
  { value: LEAVE_TYPE.UNPAID_LEAVE, label: "Nghỉ không lương" },
  { value: LEAVE_TYPE.OTHER, label: "Khác" },
] as const

export const REGIME_TYPE_OPTIONS = [
  { value: "paid", label: "Có hưởng lương" },
  { value: "unpaid", label: "Không lương" },
] as const
