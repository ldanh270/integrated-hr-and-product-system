import { PageHeader } from "@/components/common"
import { WeeklyScheduleCalendar } from "@/components/features/attendance/weekly-schedule-calendar"

export default function RealShift() {
  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Thời gian thực"
        description="So sánh thời gian làm thực tế với ca làm việc được phân trong tuần."
      />

      <WeeklyScheduleCalendar title="Thời gian thực" view="actual" showAllShifts={false} />
    </div>
  )
}
