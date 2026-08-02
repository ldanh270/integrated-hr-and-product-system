import { minutesToTime } from "@/lib/utils"
import type { IHoliday, IPlannedWeek } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"
import type { WeekDay } from "@/utils/attendance/get-week-dates"
import { pickHolidayForEmployee } from "@/utils/attendance/pick-holiday-for-employee.util"

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
      <div className="flex min-h-36 min-w-0 flex-col justify-center px-4 py-4">
        <p className="truncate font-medium" title={employee.fullName}>
          {employee.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={employee.email}>
          {employee.email}
        </p>
      </div>
      {weekDates.map((day) => {
        // Resolve scope per employee instead of treating the first holiday on a date as global.
        const holiday = pickHolidayForEmployee(holidaysByDate.get(day.dateKey), employee)
        const shifts = plannedDaysByDate.get(day.dateKey)?.shifts ?? []

        return (
          <div key={day.dateKey} className="flex min-h-36 min-w-0 items-center px-2 py-4">
            {holiday ? (
              <div className="flex h-16 w-full min-w-0 items-center truncate rounded-lg bg-success/10 p-2 text-xs font-semibold text-success">
                Nhân viên được nghỉ lễ
              </div>
            ) : shifts.length > 0 ? (
              <div className="grid w-full min-w-0 gap-2">
                {shifts.map((entry) => (
                  <div
                    key={entry.shiftId}
                    className="flex h-16 w-full min-w-0 flex-col justify-center rounded-lg bg-primary/10 px-2 py-2"
                  >
                    <p
                      className="truncate text-xs font-semibold text-primary"
                      title={entry.shift.name}
                    >
                      {entry.shift.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {minutesToTime(entry.shift.startTime)} – {minutesToTime(entry.shift.endTime)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        )
      })}
    </>
  )
}
