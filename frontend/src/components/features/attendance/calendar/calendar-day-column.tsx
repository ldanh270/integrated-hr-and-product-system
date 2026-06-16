import { ActualWorkBlock } from "@/components/features/attendance/calendar/actual-work-block"
import { HolidayBlock } from "@/components/features/attendance/calendar/holiday-block"
import { PlannedShiftBlock } from "@/components/features/attendance/calendar/planned-shift-block"
import { ShiftOptionBlock } from "@/components/features/attendance/calendar/shift-option-block"
import { CALENDAR_HOURS, type CalendarTab } from "@/config/rules/calendar.config"
import { cn } from "@/lib/utils"
import type { IAttendanceRecord, IHoliday, IScheduleDay, IWorkingShift } from "@/types/attendance.types"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

interface CalendarDayColumnProps {
  day: WeekDay
  todayDayOfWeek: number
  activeTab: CalendarTab
  showAllShifts: boolean
  scheduleDay?: IScheduleDay
  record?: IAttendanceRecord
  holiday?: IHoliday
  activeShifts: IWorkingShift[]
}

export function CalendarDayColumn({
  day,
  todayDayOfWeek,
  activeTab,
  showAllShifts,
  scheduleDay,
  record,
  holiday,
  activeShifts,
}: CalendarDayColumnProps) {
  return (
    <div
      className={cn(
        "relative divide-y divide-border/40 border-r border-border/60 last:border-r-0",
        day.dayOfWeek === todayDayOfWeek && "bg-primary/5",
      )}
    >
      {CALENDAR_HOURS.map((hour) => (
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
}
