import { TableCell } from "@/components/ui/table"
import { minutesToTime } from "@/lib/utils"
import type { IHoliday, IPlannedWeek } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"
import { pickHolidayForEmployee } from "@/utils/attendance/pick-holiday-for-employee.util"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

interface EmployeeScheduleCellsProps {
  employee: Employee
  plannedWeek?: IPlannedWeek
  weekDates: WeekDay[]
  holidaysByDate: Map<string, IHoliday[]>
}

export function EmployeeScheduleCells({
  employee,
  plannedWeek,
  weekDates,
  holidaysByDate,
}: EmployeeScheduleCellsProps) {
  const plannedDaysByDate = new Map(plannedWeek?.days.map((day) => [day.date, day]) ?? [])

  return (
    <>
      <TableCell className="px-4 py-4">
        <p className="font-medium whitespace-nowrap">{employee.fullName}</p>
        <p className="text-xs text-muted-foreground">{employee.email}</p>
      </TableCell>
      {weekDates.map((day) => {
        // Resolve scope per employee instead of treating the first holiday on a date as global.
        const holiday = pickHolidayForEmployee(holidaysByDate.get(day.dateKey), employee)
        const shifts = plannedDaysByDate.get(day.dateKey)?.shifts ?? []

        return (
          <TableCell key={day.dateKey} className="min-w-36 px-4 py-4 align-top">
            {holiday ? (
              <div className="rounded-lg bg-success/10 p-2 text-xs font-semibold text-success">
                Nhân viên được nghỉ lễ
              </div>
            ) : shifts.length > 0 ? (
              <div className="space-y-1.5">
                {shifts.map((entry) => (
                  <div key={entry.shiftId} className="rounded-lg bg-primary/10 p-2">
                    <p className="text-xs font-semibold text-primary">{entry.shift.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {minutesToTime(entry.shift.startTime)} – {minutesToTime(entry.shift.endTime)}
                    </p>
                  </div>
                ))}
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
