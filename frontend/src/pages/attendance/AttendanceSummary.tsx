import { PageHeader } from "@/components/common"
import { AttendanceSummaryContent } from "@/components/features/attendance/attendance-summary-content"

export default function AttendanceSummary() {
  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Tổng hợp chấm công"
        description="Tóm tắt tình hình đi làm, giờ công và kỷ luật chấm công trong tháng."
      />

      <AttendanceSummaryContent />
    </div>
  )
}
