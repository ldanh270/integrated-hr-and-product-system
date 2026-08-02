/** Displays company schedules for a selected week and employee search scope. */
import { PageCard } from "@/components/common"
import { EmployeeScheduleCells } from "@/components/features/attendance/employee-schedule-cells"
import { WorkScheduleToolbar } from "@/components/features/attendance/work-schedule-toolbar"
import { CALENDAR_WEEK_DAY_COUNT } from "@/config/rules/calendar.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { holidaysApi, schedulesApi } from "@/lib/api/attendance.api"
import { addDays } from "@/utils/attendance/add-days"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import { groupHolidaysByDate } from "@/utils/attendance/pick-holiday-for-employee.util"

import { useState } from "react"

import { useQueries, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

const SCHEDULE_GRID_COLUMNS = "minmax(150px, 0.9fr) repeat(7, minmax(0, 1fr))"

export function CompanyWorkSchedulesView() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [employeeSearch, setEmployeeSearch] = useState("")
  const weekStart = getWeekStart(selectedDate)
  const weekDates = getWeekDates(weekStart)
  const weekStartIso = formatDateParam(weekStart)
  const weekEndIso = weekDates[CALENDAR_WEEK_DAY_COUNT - 1].dateKey
  const weekRangeLabel = getWeekRangeLabel(weekDates)
  const {
    data: employeeData,
    isLoading: isEmployeesLoading,
    isError: isEmployeesError,
  } = useEmployees({
    page: 1,
    limit: SYSTEM_CONFIG.PAGINATION.BULK_LIMIT,
    search: employeeSearch || undefined,
  })
  const employees = employeeData?.data ?? []
  const scheduleQueries = useQueries({
    queries: employees.map((employee) => ({
      queryKey: ["employee-planned-week", employee.id, weekStartIso],
      queryFn: () => schedulesApi.getEmployeePlannedWeek(employee.id, weekStartIso),
      enabled: employees.length > 0,
    })),
  })
  const {
    data: holidays,
    isLoading: isHolidaysLoading,
    isError: isHolidaysError,
  } = useQuery({
    queryKey: ["holidays", weekStartIso, weekEndIso],
    queryFn: () => holidaysApi.getAll({ startDate: weekStartIso, endDate: weekEndIso }),
  })
  const isSchedulesLoading = scheduleQueries.some((query) => query.isLoading)
  const isSchedulesError = scheduleQueries.some((query) => query.isError)
  // Preserve every scoped holiday on a date; the employee row chooses the applicable one later.
  const holidaysByDate = groupHolidaysByDate(holidays ?? [])
  const plannedWeeksByEmployeeId = new Map(
    employees.flatMap((employee, index) => {
      const plannedWeek = scheduleQueries.at(index)?.data
      return plannedWeek ? [[employee.id, plannedWeek]] : []
    }),
  )

  const handleDateChange = (value: string) => {
    if (!value) return
    setSelectedDate(new Date(`${value}T00:00:00`))
  }

  return (
    <div className="space-y-4">
      <WorkScheduleToolbar
        employeeSearch={employeeSearch}
        selectedDate={selectedDate}
        weekRangeLabel={weekRangeLabel}
        onEmployeeSearchChange={setEmployeeSearch}
        onMoveWeek={(direction) => {
          setSelectedDate((currentDate) =>
            addDays(currentDate, direction * CALENDAR_WEEK_DAY_COUNT),
          )
        }}
        onSelectedDateChange={handleDateChange}
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        <div className="w-full overflow-hidden text-sm">
          <div
            className="grid border-b bg-muted/40"
            style={{ gridTemplateColumns: SCHEDULE_GRID_COLUMNS }}
          >
            <div className="min-w-0 px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              <span className="block truncate">Nhân viên</span>
            </div>
            {weekDates.map((day) => (
              <div
                key={day.dateKey}
                className="min-w-0 px-3 py-3 text-xs font-medium text-muted-foreground uppercase"
              >
                <p className="truncate">{day.label}</p>
                <p className="mt-1 truncate text-[11px] text-primary">{day.shortDate}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-border">
            {isEmployeesLoading || isSchedulesLoading || isHolidaysLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : isEmployeesError || isSchedulesError || isHolidaysError ? (
              <div className="flex h-24 items-center justify-center text-destructive">
                Lỗi khi tải lịch làm việc nhân viên.
              </div>
            ) : employees.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                Không có nhân viên nào.
              </div>
            ) : (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="grid min-w-0 transition-colors hover:bg-muted/30"
                  style={{ gridTemplateColumns: SCHEDULE_GRID_COLUMNS }}
                >
                  <EmployeeScheduleCells
                    employee={employee}
                    plannedWeek={plannedWeeksByEmployeeId.get(employee.id)}
                    weekDates={weekDates}
                    holidaysByDate={holidaysByDate}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </PageCard>
    </div>
  )
}
