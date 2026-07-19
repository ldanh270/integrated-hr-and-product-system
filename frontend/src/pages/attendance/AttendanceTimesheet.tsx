/** Route page that hosts the admin-only workforce attendance matrix. */
import { AttendanceMatrix } from "@/components/features/attendance/attendance-matrix"

/** Admin attendance route: focused workforce timesheet only. */
export default function AttendanceTimesheet() {
  return (
    <main className="container h-[calc(100vh-4.5rem)] overflow-hidden p-6">
      <AttendanceMatrix />
    </main>
  )
}
