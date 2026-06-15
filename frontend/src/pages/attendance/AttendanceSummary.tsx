import { PageCard, PageHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { holidaysApi, schedulesApi } from "@/lib/api/attendance.api"
import { useAuthStore } from "@/store/auth-store"
import type { IHoliday, ISchedule } from "@/types/attendance.types"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
import {
  AlarmClock,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  TimerReset,
} from "lucide-react"
import { Navigate } from "react-router-dom"

function getMonthName(month: number) {
  switch (month) {
    case 0:
      return "Tháng 1"
    case 1:
      return "Tháng 2"
    case 2:
      return "Tháng 3"
    case 3:
      return "Tháng 4"
    case 4:
      return "Tháng 5"
    case 5:
      return "Tháng 6"
    case 6:
      return "Tháng 7"
    case 7:
      return "Tháng 8"
    case 8:
      return "Tháng 9"
    case 9:
      return "Tháng 10"
    case 10:
      return "Tháng 11"
    case 11:
      return "Tháng 12"
    default:
      return "Tháng không hợp lệ"
  }
}

function formatDateParam(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${date.getFullYear()}-${month}-${day}`
}

function getMonthRange(year: number, month: number) {
  return {
    startDate: formatDateParam(new Date(year, month, 1)),
    endDate: formatDateParam(new Date(year, month + 1, 0)),
  }
}

function countScheduledShiftsInMonth(
  schedule: ISchedule | null | undefined,
  year: number,
  month: number,
  holidaysByDate: Map<string, IHoliday>,
) {
  if (!schedule) return 0

  const lastDay = new Date(year, month + 1, 0).getDate()
  let count = 0

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month, day)
    const dateKey = formatDateParam(date)
    const isHoliday = holidaysByDate.has(dateKey)
    const isScheduled = schedule.days.some((item) => item.dayOfWeek === date.getDay())

    if (isScheduled && !isHoliday) count += 1
  }

  return count
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <PageCard padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </PageCard>
  )
}

export default function AttendanceSummary() {
  const user = useAuthStore((state) => state.user)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const { startDate, endDate } = getMonthRange(year, month)

  const { data: records, isLoading: isRecordsLoading } = useAttendanceRecords({ startDate, endDate })
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["my-schedule", startDate],
    queryFn: () => schedulesApi.getMy(startDate),
  })
  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ["holidays", startDate, endDate],
    queryFn: () => holidaysApi.getAll({ startDate, endDate }),
  })

  if (user?.role === ROLE.ADMIN) {
    return <Navigate to={ROUTES.ATTENDANCE.DASHBOARD} replace />
  }

  const totalWorkMinutes = records?.reduce((sum, record) => sum + record.totalWorkMinutes, 0) ?? 0
  const lateCount = records?.filter((record) => record.status === "late").length ?? 0
  const absentCount = records?.filter((record) => record.status === "absent").length ?? 0
  const onTimeCount = records?.filter((record) => record.status === "on_time").length ?? 0
  const overtimeCount = records?.filter((record) => record.overtimeMinutes > 0).length ?? 0
  const earlyLeaveCount = records?.filter((record) => record.earlyLeaveMinutes > 0).length ?? 0
  const workedShiftCount = records?.filter((record) => record.checkInAt && record.checkOutAt).length ?? 0
  const holidaysByDate = new Map(
    holidays?.map((holiday) => [formatDateParam(new Date(holiday.date)), holiday]) ?? [],
  )
  const scheduledShiftCount = countScheduledShiftsInMonth(schedule, year, month, holidaysByDate)
  const completionRate =
    scheduledShiftCount > 0 ? Math.round((workedShiftCount / scheduledShiftCount) * 100) : 0
  const averageWorkMinutes = workedShiftCount > 0 ? Math.round(totalWorkMinutes / workedShiftCount) : 0
  const isLoading = isRecordsLoading || isScheduleLoading || isHolidaysLoading

  const goToPrev = () => {
    if (month === 0) {
      setYear((currentYear) => currentYear - 1)
      setMonth(11)
      return
    }

    setMonth((currentMonth) => currentMonth - 1)
  }

  const goToNext = () => {
    if (month === 11) {
      setYear((currentYear) => currentYear + 1)
      setMonth(0)
      return
    }

    setMonth((currentMonth) => currentMonth + 1)
  }

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Tổng hợp chấm công"
        description="Tóm tắt tình hình đi làm, giờ công và kỷ luật chấm công trong tháng."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">
            {getMonthName(month)} {year}
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

      {isLoading ? (
        <PageCard className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </PageCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tổng giờ làm"
              value={formatHours(totalWorkMinutes)}
              description="Tổng thời gian đã ghi nhận"
              icon={Clock}
            />
            <StatCard
              title="Số ca được phân"
              value={scheduledShiftCount}
              description="Không tính ngày nghỉ lễ"
              icon={BriefcaseBusiness}
            />
            <StatCard
              title="Số ca đã làm"
              value={workedShiftCount}
              description={`${completionRate}% so với ca được phân`}
              icon={CalendarCheck}
            />
            <StatCard
              title="Trung bình mỗi ca"
              value={formatHours(averageWorkMinutes)}
              description="Tính trên ca có check-in/out"
              icon={TimerReset}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Đúng giờ" value={onTimeCount} description="Số lần chấm công đúng giờ" icon={CalendarCheck} />
            <StatCard title="Đi muộn" value={lateCount} description="Số lần bị ghi nhận đi muộn" icon={AlarmClock} />
            <StatCard title="Vắng mặt" value={absentCount} description="Số ngày không có mặt" icon={CalendarX2} />
            <StatCard title="OT / Về sớm" value={`${overtimeCount} / ${earlyLeaveCount}`} description="Lượt tăng ca và về sớm" icon={TimerReset} />
          </div>
        </>
      )}
    </div>
  )
}
