import type { IApplicationType } from "@/config/entities/attendance.config"

import {
  Briefcase,
  Calendar,
  CalendarClock,
  Clock,
  Laptop,
  Repeat2,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"

export type ApplicationTypeMeta = {
  label: string
  icon: LucideIcon
  color: string
  bg: string
  border: string
  hint: string
}

export const APP_TYPE_META: Record<IApplicationType, ApplicationTypeMeta> = {
  leave: {
    label: "Nghỉ phép",
    icon: Calendar,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    hint: "Xin nghỉ phép năm, thai sản, ốm...",
  },
  overtime: {
    label: "Làm thêm giờ",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    hint: "Đăng ký làm thêm giờ ngoài ca",
  },
  work_from_home: {
    label: "WFH",
    icon: Laptop,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/20",
    hint: "Làm việc từ xa / tại nhà",
  },
  shift_swap: {
    label: "Đổi ca",
    icon: Repeat2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    hint: "Đề xuất đổi ca với đồng nghiệp",
  },
  business_trip: {
    label: "Công tác",
    icon: Briefcase,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    hint: "Đi công tác theo yêu cầu",
  },
  late_early: {
    label: "Đi muộn/Về sớm",
    icon: CalendarClock,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    hint: "Thông báo đi muộn hoặc về sớm",
  },
  regime: {
    label: "Thai sản/Bệnh",
    icon: Stethoscope,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/20",
    hint: "Chế độ thai sản, ốm đau...",
  },
}
