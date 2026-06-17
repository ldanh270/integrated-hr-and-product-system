import { EmployeeScheduleCells } from "@/components/features/attendance/employee-schedule-cells"
import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
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

import { useState } from "react"

import { useQueries, useQuery } from "@tanstack/react-query"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

const SCHEDULE_TABLE_COLUMN_COUNT = CALENDAR_WEEK_DAY_COUNT + 1

export function CompanyWorkSchedulesView() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const weekDates = getWeekDates(weekStart)
  const weekStartIso = formatDateParam(weekStart)
  const weekEndIso = weekDates[CALENDAR_WEEK_DAY_COUNT - 1].dateKey
  const weekRangeLabel = getWeekRangeLabel(weekDates)
  const { data: employeeData, isLoading: isEmployeesLoading, isError: isEmployeesError } = useEmployees({
    page: 1,
    limit: SYSTEM_CONFIG.PAGINATION.BULK_LIMIT,
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
  const holidaysByDate = new Map(
    holidays?.map((holiday) => [formatDateParam(new Date(holiday.date)), holiday]) ?? [],
  )
  const schedulesByEmployeeId = getScheduleByEmployeeId(
    scheduleQueries.map((query) => query.data),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{weekRangeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => {
              setWeekStart((currentWeekStart) => addDays(currentWeekStart, -CALENDAR_WEEK_DAY_COUNT))
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => {
              setWeekStart((currentWeekStart) => addDays(currentWeekStart, CALENDAR_WEEK_DAY_COUNT))
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
                  <TableCell colSpan={SCHEDULE_TABLE_COLUMN_COUNT} className="h-24 text-center text-destructive">
                    Lỗi khi tải lịch làm việc nhân viên.
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={SCHEDULE_TABLE_COLUMN_COUNT} className="h-24 text-center text-muted-foreground">
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
