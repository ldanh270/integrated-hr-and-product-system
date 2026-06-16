import { MonthlyAttendanceSummaryCard } from "@/components/features/attendance/monthly-attendance-summary-card"
import { ScheduleRemindersCard } from "@/components/features/attendance/schedule-reminders-card"
import { WeeklyScheduleCalendar } from "@/components/features/attendance/weekly-schedule-calendar"
import VirtualScanner from "@/components/features/attendance/virtual-scanner"
import { PageHeader } from "@/components/common"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { getMonthRange } from "@/utils/attendance/get-month-range"

export function EmployeeMyScheduleView() {
  const now = new Date()
  const { startDate, endDate } = getMonthRange(now.getFullYear(), now.getMonth())
  const { data: records } = useAttendanceRecords({ startDate, endDate })

  const totalWorkMinutes = records?.reduce((sum, record) => sum + (record.totalWorkMinutes ?? 0), 0) ?? 0
  const lateCount = records?.filter((record) => record.status === "late").length ?? 0
  const absentCount = records?.filter((record) => record.status === "absent").length ?? 0

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch của tôi"
        description="Xem ca làm việc được phân trong tuần và tóm tắt chấm công cá nhân."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <VirtualScanner />
          <ScheduleRemindersCard />
          <MonthlyAttendanceSummaryCard
            totalWorkMinutes={totalWorkMinutes}
            lateCount={lateCount}
            absentCount={absentCount}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <WeeklyScheduleCalendar showAllShifts />
        </div>
      </div>
    </div>
  )
}
