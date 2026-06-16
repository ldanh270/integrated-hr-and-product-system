import { EmptyState, PageCard, SectionHeader } from "@/components/common"
import { WeeklyScheduleCalendar } from "@/components/features/attendance/weekly-schedule-calendar"

/**
 * WorkSchedule — Dashboard component that renders the weekly shift planner calendar and the task list.
 * Fetches real schedule data for the authenticated user.
 */
export default function WorkSchedule() {
  return (
    <div className="space-y-4">
      {/* Task List Card — Placeholder for upcoming work items */}
      <PageCard>
        <SectionHeader title="Việc cần làm" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-muted-foreground font-semibold">
            <thead>
              <tr className="border-b border-border/65">
                <th className="py-2 pr-4">Mã công việc</th>
                <th className="py-2 pr-4">Tên công việc</th>
                <th className="py-2 pr-4">Tiến độ</th>
                <th className="py-2 pr-4">Trạng thái</th>
                <th className="py-2">Ngày bắt đầu</th>
              </tr>
            </thead>
          </table>
          <EmptyState message="Không có công việc nào được giao trong tuần này" />
        </div>
      </PageCard>

      <WeeklyScheduleCalendar />
    </div>
  )
}
