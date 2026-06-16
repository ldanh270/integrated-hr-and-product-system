import { CalendarDayColumn } from "@/components/features/attendance/calendar/calendar-day-column"
import { EmptyState } from "@/components/common"
import { CALENDAR_HOURS, type CalendarTab } from "@/config/rules/calendar.config"
import { cn } from "@/lib/utils"
import type { IAttendanceRecord, IHoliday, IScheduleDay, IWorkingShift } from "@/types/attendance.types"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

import { Loader2 } from "lucide-react"

interface CalendarGridProps {
  weekDays: WeekDay[]
  todayDayOfWeek: number
  activeTab: CalendarTab
  showAllShifts: boolean
  isLoading: boolean
  isEmpty: boolean
  scheduleDaysByDay: Map<number, IScheduleDay>
  recordsByDate: Map<string, IAttendanceRecord>
  holidaysByDate: Map<string, IHoliday>
  activeShifts: IWorkingShift[]
}

export function CalendarGrid({
  weekDays,
  todayDayOfWeek,
  activeTab,
  showAllShifts,
  isLoading,
  isEmpty,
  scheduleDaysByDay,
  recordsByDate,
  holidaysByDate,
  activeShifts,
}: CalendarGridProps) {
  return (
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
          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isEmpty ? (
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
            {CALENDAR_HOURS.map((hour) => (
              <div
                key={hour}
                className="flex h-12 items-start px-3 py-2 text-xs font-semibold text-muted-foreground"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {weekDays.map((day) => (
            <CalendarDayColumn
              key={day.shortDate}
              day={day}
              todayDayOfWeek={todayDayOfWeek}
              activeTab={activeTab}
              showAllShifts={showAllShifts}
              scheduleDay={scheduleDaysByDay.get(day.dayOfWeek)}
              record={recordsByDate.get(day.dateKey)}
              holiday={holidaysByDate.get(day.dateKey)}
              activeShifts={activeShifts}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
