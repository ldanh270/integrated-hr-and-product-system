import { TableCell } from "@/components/ui/table"
import { minutesToTime } from "@/lib/utils"
import type { IHoliday, ISchedule } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"
import { pickHolidayForEmployee } from "@/utils/attendance/pick-holiday-for-employee.util"
import type { WeekDay } from "@/utils/attendance/get-week-dates"
import { resolveScheduleDay } from "@/utils/attendance/resolve-schedule-day"

interface EmployeeScheduleCellsProps {
  employee: Employee
  schedule?: ISchedule
  weekDates: WeekDay[]
  holidaysByDate: Map<string, IHoliday[]>
}

export function EmployeeScheduleCells({
  employee,
  schedule,
  weekDates,
  holidaysByDate,
}: EmployeeScheduleCellsProps) {
  return (
    <>
      <TableCell className="px-4 py-4">
        <p className="font-medium whitespace-nowrap">{employee.fullName}</p>
        <p className="text-xs text-muted-foreground">{employee.email}</p>
      </TableCell>
      {weekDates.map((day) => {
        // Resolve scope per employee instead of treating the first holiday on a date as global.
        const holiday = pickHolidayForEmployee(holidaysByDate.get(day.dateKey), employee)
        const scheduleDay = resolveScheduleDay(schedule, day.date)
        const shift = scheduleDay?.shift

        return (
          <TableCell key={day.dateKey} className="min-w-36 px-4 py-4 align-top">
            {holiday ? (
              <div className="rounded-lg bg-success/10 p-2 text-xs font-semibold text-success">
                Nhân viên được nghỉ lễ
              </div>
            ) : shift ? (
              <div className="rounded-lg bg-primary/10 p-2">
                <p className="text-xs font-semibold text-primary">{shift.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {minutesToTime(shift.startTime)} – {minutesToTime(shift.endTime)}
                </p>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </TableCell>
        )
      })}
    </>
  )
}
