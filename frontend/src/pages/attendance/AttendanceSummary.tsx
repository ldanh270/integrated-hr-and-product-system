import { PageHeader } from "@/components/common"
import { AttendanceSummaryContent } from "@/components/features/attendance/attendance-summary-content"
import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"

import { Navigate } from "react-router-dom"

export default function AttendanceSummary() {
  const user = useAuthStore((state) => state.user)

  if (user?.role === ROLE.ADMIN) {
    return <Navigate to={ROUTES.ATTENDANCE.DASHBOARD} replace />
  }

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
