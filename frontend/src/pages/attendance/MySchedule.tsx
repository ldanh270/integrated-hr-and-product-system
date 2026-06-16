import { AdminEmployeeSchedulesView } from "@/components/features/attendance/admin-employee-schedules-view"
import { EmployeeMyScheduleView } from "@/components/features/attendance/employee-my-schedule-view"
import { ROLE } from "@/config/entities/employee.config"
import { useAuthStore } from "@/store/auth-store"

/**
 * MySchedule — Personal attendance and schedule page for individual employees.
 * Admin users see the all-employee weekly schedule table instead.
 */
export default function MySchedule() {
  const user = useAuthStore((state) => state.user)

  if (user?.role === ROLE.ADMIN) {
    return <AdminEmployeeSchedulesView />
  }

  return <EmployeeMyScheduleView />
}
