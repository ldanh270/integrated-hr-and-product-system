import { PageCard, SectionHeader, StatRow } from "@/components/common"

import {
  BadgeAlert,
  CalendarCheck,
  CalendarOff,
  Clock,
  FileText,
  FileWarning,
  Hourglass,
  Timer,
} from "lucide-react"

/**
 * AttendanceStats component
 * Renders detailed HR attendance counters and annual leave statuses.
 * Consumes common StatRow and PageCard primitives for consistency.
 */
export default function AttendanceStats() {
  const attendanceItems = [
    {
      value: 5,
      label: "Vào ca đúng giờ",
      icon: CalendarCheck,
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
    },
    {
      value: 4,
      label: "Số lần đi muộn",
      icon: Clock,
      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-500",
    },
    {
      value: 4,
      label: "Số lần về sớm",
      icon: Timer,
      colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-500",
    },
    {
      value: 0,
      label: "Số giờ tăng ca",
      icon: Hourglass,
      colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-500",
    },
    {
      value: 2,
      label: "Nghỉ không lý do",
      icon: CalendarOff,
      colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-500",
    },
    {
      value: 1,
      label: "Quên chốt công",
      icon: FileWarning,
      colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
  ]

  const leaveItems = [
    {
      value: 8,
      label: "Tổng phép",
      icon: FileText,
      colorClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
    },
    {
      value: 0,
      label: "Số phép đã dùng",
      icon: BadgeAlert,
      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-500",
    },
    {
      value: 8,
      label: "Số phép còn lại",
      icon: CalendarCheck,
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
    },
  ]

  return (
    <div className="space-y-4">
      <PageCard>
        <SectionHeader title="Thông tin chấm công" />
        <div>
          {attendanceItems.map((item, idx) => (
            <StatRow
              key={idx}
              icon={item.icon}
              label={item.label}
              value={item.value}
              colorClass={item.colorClass}
              isLast={idx === attendanceItems.length - 1}
            />
          ))}
        </div>
      </PageCard>

      <PageCard>
        <SectionHeader title="Thông tin phép" />
        <div>
          {leaveItems.map((item, idx) => (
            <StatRow
              key={idx}
              icon={item.icon}
              label={item.label}
              value={item.value}
              colorClass={item.colorClass}
              isLast={idx === leaveItems.length - 1}
            />
          ))}
        </div>
      </PageCard>
    </div>
  )
}
