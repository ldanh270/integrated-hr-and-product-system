import { CompanyWorkSchedulesView } from "@/components/features/attendance/company-work-schedules-view"
import { PageHeader } from "@/components/common"

export default function WorkSchedules() {
  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch làm việc"
        description="Xem lịch làm việc theo tuần của toàn bộ nhân viên."
      />

      <CompanyWorkSchedulesView />
    </div>
  )
}
