import { EmptyState, PageCard, SectionHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { holidaysApi, schedulesApi, shiftsApi } from "@/lib/api/attendance.api"
import { cn, minutesToTime } from "@/lib/utils"
import type { IAttendanceRecord, IHoliday, IScheduleDay, IWorkingShift } from "@/types/attendance.types"

import { useRef, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { Calendar, Loader2 } from "lucide-react"

const WEEK_DAY_COUNT = 7
const CALENDAR_START_HOUR = 6
const CALENDAR_END_HOUR = 24
const MINUTES_PER_HOUR = 60
const CALENDAR_START_MINUTES = CALENDAR_START_HOUR * MINUTES_PER_HOUR
const CALENDAR_END_MINUTES = CALENDAR_END_HOUR * MINUTES_PER_HOUR
const CALENDAR_TOTAL_MINUTES = CALENDAR_END_MINUTES - CALENDAR_START_MINUTES

const HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
  (_, index) => CALENDAR_START_HOUR + index,
)

interface WeekDay {
  dayOfWeek: number
  date: Date
  dateKey: string
  label: string
  shortDate: string
}

interface WeeklyScheduleCalendarProps {
  className?: string
  showAllShifts?: boolean
  showTabs?: boolean
  title?: string
  view?: CalendarTab
}

type CalendarTab = "planned" | "actual"

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

function formatShortDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${day}/${month}`
}

function formatDateParam(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${date.getFullYear()}-${month}-${day}`
}

function getDayLabel(date: Date) {
  return date.getDay() === 0 ? "CN" : `Thứ ${date.getDay() + 1}`
}

function getWeekDates(weekStart: Date): WeekDay[] {
  return Array.from({ length: WEEK_DAY_COUNT }, (_, index) => {
    const date = addDays(weekStart, index)

    return {
      dayOfWeek: date.getDay(),
      date,
      dateKey: formatDateParam(date),
      label: getDayLabel(date),
      shortDate: formatShortDate(date),
    }
  })
}

function getWeekRangeLabel(weekDays: WeekDay[]) {
  const firstDay = weekDays[0]
  const lastDay = weekDays[WEEK_DAY_COUNT - 1]

  return `${firstDay.shortDate} – ${lastDay.shortDate}/${lastDay.date.getFullYear()}`
}

function getRangeStyle(startTime: number, endTime: number) {
  const normalizedEndTime = endTime <= startTime ? endTime + 24 * MINUTES_PER_HOUR : endTime
  const startMinutes = Math.max(startTime, CALENDAR_START_MINUTES)
  const endMinutes = Math.min(normalizedEndTime, CALENDAR_END_MINUTES)

  if (endMinutes <= startMinutes) return undefined

  const top = ((startMinutes - CALENDAR_START_MINUTES) / CALENDAR_TOTAL_MINUTES) * 100
  const height = ((endMinutes - startMinutes) / CALENDAR_TOTAL_MINUTES) * 100

  return {
    top: `${top}%`,
    height: `${height}%`,
  }
}

function getMinutesFromDateTime(iso?: string | null) {
  if (!iso) return undefined

  const date = new Date(iso)

  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes()
}

function getRecordDateKey(record: IAttendanceRecord) {
  return formatDateParam(new Date(record.date))
}

function isActualShiftMatched(record: IAttendanceRecord, scheduleDay?: IScheduleDay) {
  const shift = scheduleDay?.shift
  const actualStart = getMinutesFromDateTime(record.checkInAt)
  const actualEnd = getMinutesFromDateTime(record.checkOutAt)

  return Boolean(
    shift &&
      actualStart === shift.startTime &&
      actualEnd === shift.endTime,
  )
}

function PlannedShiftBlock({ scheduleDay, isMuted = false }: { scheduleDay: IScheduleDay; isMuted?: boolean }) {
  const shift = scheduleDay.shift
  const shiftStyle = shift ? getRangeStyle(shift.startTime, shift.endTime) : undefined

  if (!shift || !shiftStyle) return null

  return (
    <div
      className={cn(
        "absolute inset-x-1 z-10 rounded-lg border-l-4 border-success bg-success/10 px-2.5 py-2 shadow-sm",
        isMuted && "opacity-60",
      )}
      style={shiftStyle}
    >
      <p className="truncate text-xs font-bold leading-tight text-success">{shift.name}</p>
      <p className="mt-0.5 text-xs font-semibold text-success/80">
        {minutesToTime(shift.startTime)}–{minutesToTime(shift.endTime)}
      </p>
    </div>
  )
}

function ShiftOptionBlock({
  shift,
  isAssigned,
}: {
  shift: IWorkingShift
  isAssigned: boolean
}) {
  const shiftStyle = getRangeStyle(shift.startTime, shift.endTime)

  if (!shiftStyle) return null

  return (
    <div
      className={cn(
        "absolute inset-x-1 z-10 rounded-lg border-l-4 px-2.5 py-2 shadow-sm transition-all",
        isAssigned
          ? "border-primary bg-primary/25 text-primary shadow-lg ring-1 ring-primary/30"
          : "border-border bg-muted/30 text-muted-foreground opacity-45",
      )}
      style={shiftStyle}
    >
      <p className="truncate text-xs font-bold leading-tight">{shift.name}</p>
      <p className="mt-0.5 text-xs font-semibold opacity-80">
        {minutesToTime(shift.startTime)}–{minutesToTime(shift.endTime)}
      </p>
    </div>
  )
}

function HolidayBlock({ holiday }: { holiday: IHoliday }) {
  return (
    <div className="absolute inset-x-1 top-1 bottom-1 z-30 flex flex-col justify-center rounded-lg border-l-4 border-success bg-success/10 px-2.5 py-2 shadow-sm">
      <p className="text-xs font-bold leading-tight text-success">Nhân viên được nghỉ lễ</p>
      <p className="mt-1 text-xs font-semibold text-success/80">{holiday.name}</p>
    </div>
  )
}

function ActualWorkBlock({
  record,
  scheduleDay,
}: {
  record: IAttendanceRecord
  scheduleDay?: IScheduleDay
}) {
  const actualStart = getMinutesFromDateTime(record.checkInAt)
  const actualEnd = getMinutesFromDateTime(record.checkOutAt)

  if (actualStart === undefined || actualEnd === undefined) return null

  const isMatched = isActualShiftMatched(record, scheduleDay)
  const actualStyle = getRangeStyle(actualStart, actualEnd)

  if (!actualStyle) return null

  return (
    <div
      className={cn(
        "absolute inset-x-3 z-20 rounded-lg border-l-4 px-2.5 py-2 shadow-sm",
        isMatched
          ? "border-success bg-success/15 text-success"
          : "border-warning bg-warning/15 text-warning",
      )}
      style={actualStyle}
    >
      <p className="truncate text-xs font-bold leading-tight">
        {isMatched ? "Đúng ca" : "Thời gian thực"}
      </p>
      <p className="mt-0.5 text-xs font-semibold opacity-80">
        {minutesToTime(actualStart)}–{minutesToTime(actualEnd)}
      </p>
    </div>
  )
}

export function WeeklyScheduleCalendar({
  className,
  showAllShifts = false,
  showTabs = false,
  title = "Lịch làm việc",
  view = "planned",
}: WeeklyScheduleCalendarProps) {
  const [selectedTab, setSelectedTab] = useState<CalendarTab>(view)
  const activeTab = showTabs ? selectedTab : view
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const weekDays = getWeekDates(weekStart)
  const today = new Date()
  const todayDayOfWeek = today.getDay()
  const weekStartIso = formatDateParam(weekStart)
  const weekEndIso = weekDays[WEEK_DAY_COUNT - 1].dateKey
  const weekRangeLabel = getWeekRangeLabel(weekDays)

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["my-schedule", weekStartIso],
    queryFn: () => schedulesApi.getMy(weekStartIso),
  })

  const { data: shifts, isLoading: isShiftsLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: shiftsApi.getAll,
    enabled: showAllShifts,
  })

  const { data: records, isLoading: isRecordsLoading } = useAttendanceRecords({
    startDate: weekStartIso,
    endDate: weekEndIso,
  })

  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ["holidays", weekStartIso, weekEndIso],
    queryFn: () => holidaysApi.getAll({ startDate: weekStartIso, endDate: weekEndIso }),
  })

  const scheduleDaysByDay = new Map(schedule?.days.map((day) => [day.dayOfWeek, day]) ?? [])
  const activeShifts =
    shifts?.filter((shift) => shift.isActive).toSorted((a, b) => a.startTime - b.startTime) ?? []
  const recordsByDate = new Map(records?.map((record) => [getRecordDateKey(record), record]) ?? [])
  const holidaysByDate = new Map(
    holidays?.map((holiday) => [formatDateParam(new Date(holiday.date)), holiday]) ?? [],
  )
  const isCalendarLoading =
    isLoading || isRecordsLoading || isHolidaysLoading || (showAllShifts && isShiftsLoading)
  const hasPlannedSchedule = showAllShifts ? activeShifts.length > 0 : Boolean(schedule?.days.length)
  const hasActualRecords = Boolean(records?.length)
  const hasHoliday = holidaysByDate.size > 0
  const isCalendarEmpty =
    activeTab === "planned"
      ? !hasPlannedSchedule && !hasHoliday
      : !hasPlannedSchedule && !hasActualRecords && !hasHoliday
  const openWeekPicker = () => {
    const input = dateInputRef.current

    if (!input) return

    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker()
      return
    }

    input.click()
  }

  return (
    <PageCard className={cn("space-y-4", className)}>
      <SectionHeader
        title={title}
        action={
          <>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={openWeekPicker}
            >
              <Calendar size={14} />
              <span>{weekRangeLabel}</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={weekStartIso}
              onChange={(event) => {
                if (!event.target.value) return

                setWeekStart(getWeekStart(new Date(event.target.value)))
              }}
              className="sr-only"
              aria-label="Chọn tuần làm việc"
            />
            <Button
              size="sm"
              className="h-8 rounded-full px-4"
              onClick={() => setWeekStart(getWeekStart(new Date()))}
            >
              Hôm nay
            </Button>
          </>
        }
      />

      {showTabs ? (
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as CalendarTab)}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="planned">Ca kế hoạch</TabsTrigger>
            <TabsTrigger value="actual">Thời gian thực</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      {showAllShifts && activeTab === "planned" ? (
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Ca của tôi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            Ca khác
          </span>
        </div>
      ) : null}

      {activeTab === "actual" ? (
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            Ca kế hoạch / đúng ca
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            Thời gian thực lệch ca
          </span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border/70">
        <div className="min-w-[48rem]">
          <div className="grid grid-cols-[7rem_repeat(7,minmax(7rem,1fr))] border-b border-border/60 bg-secondary/40 text-center text-xs font-bold text-muted-foreground">
            <div className="px-3 py-2 text-left">Giờ</div>
            {weekDays.map((day) => (
              <div
                key={day.shortDate}
                className={cn("px-3 py-2", day.dayOfWeek === todayDayOfWeek && "text-primary")}
              >
                <div className="uppercase opacity-75">{day.label}</div>
                <div className="mt-0.5">{day.shortDate}</div>
              </div>
            ))}
          </div>

          <div className="relative grid min-h-[33rem] grid-cols-[7rem_repeat(7,minmax(7rem,1fr))] bg-card">
            {isCalendarLoading ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isCalendarEmpty ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-card">
                <EmptyState
                  message={
                    activeTab === "planned"
                      ? "Bạn chưa được phân ca làm việc trong tuần này"
                      : "Chưa có dữ liệu thời gian thực trong tuần này"
                  }
                />
              </div>
            ) : null}

            <div className="divide-y divide-border/40 border-r border-border/60">
              {HOURS.map((hour) => (
                <div key={hour} className="flex h-12 items-start px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const scheduleDay = scheduleDaysByDay.get(day.dayOfWeek)
              const record = recordsByDate.get(day.dateKey)
              const holiday = holidaysByDate.get(day.dateKey)

              return (
                <div
                  key={day.shortDate}
                  className={cn(
                    "relative divide-y divide-border/40 border-r border-border/60 last:border-r-0",
                    day.dayOfWeek === todayDayOfWeek && "bg-primary/5",
                  )}
                >
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-12" />
                  ))}
                  {holiday ? <HolidayBlock holiday={holiday} /> : null}
                  {!holiday && showAllShifts && activeTab === "planned"
                    ? activeShifts.map((shift) => (
                        <ShiftOptionBlock
                          key={shift.id}
                          shift={shift}
                          isAssigned={shift.id === scheduleDay?.shiftId}
                        />
                      ))
                    : null}
                  {!holiday && !showAllShifts && scheduleDay ? (
                    <PlannedShiftBlock scheduleDay={scheduleDay} isMuted={activeTab === "actual"} />
                  ) : null}
                  {!holiday && showAllShifts && activeTab === "actual" && scheduleDay ? (
                    <PlannedShiftBlock scheduleDay={scheduleDay} isMuted />
                  ) : null}
                  {!holiday && activeTab === "actual" && record ? (
                    <ActualWorkBlock record={record} scheduleDay={scheduleDay} />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageCard>
  )
}
