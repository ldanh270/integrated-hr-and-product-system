import { PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
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
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
  DAY_OF_WEEK_LABELS,
} from "@/config/entities/attendance.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { schedulesApi } from "@/lib/api/attendance.api"
import { formatDate, formatTime, minutesToTime } from "@/lib/utils"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
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
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

/**
 * MySchedule — Personal attendance and schedule page for individual employees.
 * Allows users to view their past records and planned shifts month-by-month.
 */
export default function MySchedule() {
  const now = new Date()
  // year, month: Local state for navigating through calendar months
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // Deriving date range for current view
  const { startDate, endDate } = getMonthRange(year, month)

  /**
   * useAttendanceRecords — Fetches the authenticated user's actual attendance logs.
   * Calls API: attendanceApi.getRecords
   */
  const { data: records, isLoading: isRecordsLoading, isError } = useAttendanceRecords({ startDate, endDate })

  /**
   * useQuery — Fetches the authenticated user's planned shift schedule (current/active).
   * Calls API: schedulesApi.getMy
   */
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["my-schedule"],
    queryFn: () => schedulesApi.getMy(),
  })

  // isLoading: Combined loading state for better UI feedback
  const isLoading = isRecordsLoading || isScheduleLoading

  /**
   * goToPrev — Navigates to the previous calendar month.
   */
  const goToPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  /**
   * goToNext — Navigates to the next calendar month.
   */
  const goToNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const MONTH_NAMES = [
    "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
  ]

  // Deriving summary stats from fetched records
  const totalWorkMinutes = records?.reduce((sum, r) => sum + (r.totalWorkMinutes ?? 0), 0) ?? 0
  const lateCount = records?.filter(r => r.status === "late").length ?? 0
  const absentCount = records?.filter(r => r.status === "absent").length ?? 0

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch trình & Chấm công"
        description="Xem lịch làm việc và lịch sử chấm công của bạn."
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

        {/* Right column: Main attendance records table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Month navigation control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {MONTH_NAMES[month]} {year}
              </span>
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
                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Ngày
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Ca làm việc
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Check In / Out
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap text-center">
                      Giờ làm
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Trạng thái
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-destructive">
                        Lỗi khi tải dữ liệu chấm công.
                      </TableCell>
                    </TableRow>
                  ) : !records || records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Không có dữ liệu chấm công trong tháng này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => {
                      const d = new Date(record.date)
                      const dow = DAY_OF_WEEK_LABELS[d.getDay()]
                      const workHours = Math.floor(record.totalWorkMinutes / 60)
                      const workMins = record.totalWorkMinutes % 60

                      // Finding planned shift name and time from fetch schedule data
                      const scheduleDay = schedule?.days.find(sd => sd.dayOfWeek === d.getDay())
                      const plannedShift = scheduleDay?.shift

                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30">
                          <TableCell className="px-4 py-4 whitespace-nowrap">
                            <span className="font-medium">{formatDate(record.date)}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{dow}</span>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            {plannedShift ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-xs">{plannedShift.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {minutesToTime(plannedShift.startTime)} - {minutesToTime(plannedShift.endTime)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-4 font-mono text-sm whitespace-nowrap">
                            <span className={record.checkInAt ? "text-foreground" : "text-muted-foreground"}>
                              {formatTime(record.checkInAt)}
                            </span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className={record.checkOutAt ? "text-foreground" : "text-muted-foreground"}>
                              {formatTime(record.checkOutAt)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-muted-foreground text-center">
                            {record.totalWorkMinutes > 0
                              ? `${workHours}h${workMins > 0 ? `${workMins}m` : ""}`
                              : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <StatusPill
                              label={ATTENDANCE_STATUS_LABELS[record.status] ?? record.status}
                              variant={ATTENDANCE_STATUS_VARIANTS[record.status] ?? "neutral"}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  )
}
