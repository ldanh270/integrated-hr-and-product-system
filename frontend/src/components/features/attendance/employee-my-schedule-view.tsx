import { PersonalAttendanceSchedulePanel } from "@/components/features/attendance/personal-attendance-schedule-panel"
import { PageHeader } from "@/components/common"

export function EmployeeMyScheduleView() {
  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch của tôi"
        description="Chấm công và xem thời khóa biểu ca làm việc trong tuần."
      />

      <PersonalAttendanceSchedulePanel />
    </div>
  )
}
