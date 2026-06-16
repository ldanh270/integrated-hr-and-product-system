import { AdminAttendanceDashboard } from "@/components/features/attendance/dashboard/admin-attendance-dashboard"
import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"

import { Navigate } from "react-router-dom"

function canManageAttendance(role?: string) {
  return role === ROLE.ADMIN || role === ROLE.HR_MANAGER || role === ROLE.GENERAL_MANAGER
}

export default function AttendanceDashboard() {
  const user = useAuthStore((state) => state.user)

  if (user && !canManageAttendance(user.role)) {
    return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
  }

  return <AdminAttendanceDashboard />
}
