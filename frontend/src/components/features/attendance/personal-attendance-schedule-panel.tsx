import { WeeklyScheduleCalendar } from "@/components/features/attendance/weekly-schedule-calendar"
import { VirtualScanner } from "@/components/features/attendance/VirtualScanner"

export function PersonalAttendanceSchedulePanel() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(18rem,22rem)_1fr] lg:items-start">
      <VirtualScanner />
      <WeeklyScheduleCalendar title="Thời khóa biểu tuần" />
    </div>
  )
}
