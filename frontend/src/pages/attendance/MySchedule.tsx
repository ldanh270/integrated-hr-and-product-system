import { PageCard, PageHeader } from "@/components/common"
import { WeeklyScheduleCalendar } from "@/components/features/attendance/weekly-schedule-calendar"
import VirtualScanner from "@/components/features/attendance/VirtualScanner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE } from "@/config/entities/employee.config"
import { DAY_OF_WEEK_FULL_LABELS } from "@/config/entities/attendance.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { holidaysApi, schedulesApi } from "@/lib/api/attendance.api"
import { minutesToTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type { IHoliday, ISchedule } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"

import { useState } from "react"

import { useQueries, useQuery } from "@tanstack/react-query"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

/**
 * getMonthRange — Returns ISO strings for the first and last day of a given month/year.
 * @param {number} year 
 * @param {number} month (0-indexed)
 * @returns { startDate: string, endDate: string } format YYYY-MM-DD
 */
function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  return {
    startDate: formatDateParam(start),
    endDate: formatDateParam(end),
  }
}

function formatDateParam(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${date.getFullYear()}-${month}-${day}`
}

function getWeekStart(date: Date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)

  start.setDate(diff)
  start.setHours(0, 0, 0, 0)

  return start
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + days)

  return nextDate
}

function getWeekDates(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    const dayOfWeek = date.getDay()
    const dateKey = formatDateParam(date)

    return {
      date,
      dateKey,
      dayOfWeek,
      label: DAY_OF_WEEK_FULL_LABELS[dayOfWeek],
      shortDate: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
    }
  })
}

function getWeekRangeLabel(weekDates: ReturnType<typeof getWeekDates>) {
  const firstDay = weekDates[0]
  const lastDay = weekDates[6]

  return `${firstDay.shortDate} – ${lastDay.shortDate}/${lastDay.date.getFullYear()}`
}

function getScheduleByEmployeeId(schedules: (ISchedule | null | undefined)[]) {
  return new Map(schedules.flatMap((schedule) => (schedule ? [[schedule.employeeId, schedule]] : [])))
}

function EmployeeScheduleCells({
  employee,
  schedule,
  weekDates,
  holidaysByDate,
}: {
  employee: Employee
  schedule?: ISchedule
  weekDates: ReturnType<typeof getWeekDates>
  holidaysByDate: Map<string, IHoliday>
}) {
  return (
    <>
      <TableCell className="px-4 py-4">
        <p className="font-medium whitespace-nowrap">{employee.fullName}</p>
        <p className="text-xs text-muted-foreground">{employee.email}</p>
      </TableCell>
      {weekDates.map((day) => {
        const holiday = holidaysByDate.get(day.dateKey)
        const scheduleDay = schedule?.days.find((item) => item.dayOfWeek === day.dayOfWeek)
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

/**
 * MySchedule — Personal attendance and schedule page for individual employees.
 * Allows users to view their past records and planned shifts month-by-month.
 */
export default function MySchedule() {
  const user = useAuthStore((state) => state.user)

  if (user?.role === ROLE.ADMIN) {
    return <AdminAllEmployeeSchedules />
  }

  return <EmployeeMySchedule />
}

function EmployeeMySchedule() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const { startDate, endDate } = getMonthRange(year, month)

  /**
   * useAttendanceRecords — Fetches the authenticated user's actual attendance logs.
   * Calls API: attendanceApi.getRecords
   */
  const { data: records } = useAttendanceRecords({ startDate, endDate })

  // Deriving summary stats from fetched records
  const totalWorkMinutes = records?.reduce((sum, r) => sum + (r.totalWorkMinutes ?? 0), 0) ?? 0
  const lateCount = records?.filter(r => r.status === "late").length ?? 0
  const absentCount = records?.filter(r => r.status === "absent").length ?? 0

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch của tôi"
        description="Xem ca làm việc được phân trong tuần và tóm tắt chấm công cá nhân."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Scanner + Guidelines + Monthly Summary */}
        <div className="space-y-4">
          <VirtualScanner />

          <PageCard padding="md">
            <h3 className="font-semibold text-sm mb-3">Nhắc nhở</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
              <li>Chỉ có thể Check In khi đang ở trong khu vực văn phòng.</li>
              <li>Check In trễ quá thời gian ân hạn sẽ bị ghi nhận là Đi Muộn.</li>
              <li>Nhớ Check Out khi về để tính tổng giờ làm.</li>
            </ul>
          </PageCard>

          {/* Monthly stats breakdown */}
          <PageCard padding="md" className="space-y-3">
            <h3 className="font-semibold text-sm">Tóm tắt tháng</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xl font-bold text-foreground">
                  {Math.floor(totalWorkMinutes / 60)}h
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Tổng giờ</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3">
                <p className="text-xl font-bold text-warning">{lateCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Đi muộn</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-xl font-bold text-destructive">{absentCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vắng mặt</p>
              </div>
            </div>
          </PageCard>
        </div>

        {/* Right column: Weekly schedule overview */}
        <div className="lg:col-span-2 space-y-4">
          <WeeklyScheduleCalendar showAllShifts />
        </div>
      </div>
    </div>
  )
}

function AdminAllEmployeeSchedules() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const weekDates = getWeekDates(weekStart)
  const weekStartIso = formatDateParam(weekStart)
  const weekEndIso = weekDates[6].dateKey
  const weekRangeLabel = getWeekRangeLabel(weekDates)
  const { data: employeeData, isLoading: isEmployeesLoading, isError: isEmployeesError } = useEmployees({
    page: 1,
    limit: 1000,
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

  const goToPrev = () => {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, -7))
  }

  const goToNext = () => {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, 7))
  }

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch của tôi"
        description="Xem lịch làm việc theo tuần của toàn bộ nhân viên."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{weekRangeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNext}>
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
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : isEmployeesError || isSchedulesError || isHolidaysError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-destructive">
                      Lỗi khi tải lịch làm việc nhân viên.
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
    </div>
  )
}
