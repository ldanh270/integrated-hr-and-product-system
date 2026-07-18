/** Displays company schedules for a selected week and employee search scope. */
import { PageCard } from "@/components/common"
import { EmployeeScheduleCells } from "@/components/features/attendance/employee-schedule-cells"
import { WorkScheduleToolbar } from "@/components/features/attendance/work-schedule-toolbar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CALENDAR_WEEK_DAY_COUNT } from "@/config/rules/calendar.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { holidaysApi, schedulesApi } from "@/lib/api/attendance.api"
import { addDays } from "@/utils/attendance/add-days"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getScheduleByEmployeeId } from "@/utils/attendance/get-schedule-by-employee-id"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import { groupHolidaysByDate } from "@/utils/attendance/pick-holiday-for-employee.util"

import { useState } from "react"

import { useQueries, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

const SCHEDULE_TABLE_COLUMN_COUNT = CALENDAR_WEEK_DAY_COUNT + 1

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
      queryKey: ["employee-schedule", employee.id, weekStartIso],
      queryFn: () => schedulesApi.getByEmployee(employee.id, weekStartIso),
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
  const schedulesByEmployeeId = getScheduleByEmployeeId(scheduleQueries.map((query) => query.data))

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
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Nhân viên
                </TableHead>
                {weekDates.map((day) => (
                  <TableHead
                    key={day.dateKey}
                    className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap"
                  >
                    <p>{day.label}</p>
                    <p className="mt-1 text-[11px] text-primary">{day.shortDate}</p>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border">
              {isEmployeesLoading || isSchedulesLoading || isHolidaysLoading ? (
                <TableRow>
                  <TableCell colSpan={SCHEDULE_TABLE_COLUMN_COUNT} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isEmployeesError || isSchedulesError || isHolidaysError ? (
                <TableRow>
                  <TableCell
                    colSpan={SCHEDULE_TABLE_COLUMN_COUNT}
                    className="h-24 text-center text-destructive"
                  >
                    Lỗi khi tải lịch làm việc nhân viên.
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={SCHEDULE_TABLE_COLUMN_COUNT}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có nhân viên nào.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/30">
                    <EmployeeScheduleCells
                      employee={employee}
                      schedule={schedulesByEmployeeId.get(employee.id)}
                      weekDates={weekDates}
                      holidaysByDate={holidaysByDate}
                    />
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PageCard>
    </div>
  )
}
