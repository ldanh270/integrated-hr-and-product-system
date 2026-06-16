import { cn, minutesToTime } from "@/lib/utils"
import type { IScheduleDay } from "@/types/attendance.types"
import { getCalendarRangeStyle } from "@/utils/attendance/get-calendar-range-style"

interface PlannedShiftBlockProps {
  scheduleDay: IScheduleDay
  isMuted?: boolean
}

export function PlannedShiftBlock({ scheduleDay, isMuted = false }: PlannedShiftBlockProps) {
  const shift = scheduleDay.shift
  const shiftStyle = shift ? getCalendarRangeStyle(shift.startTime, shift.endTime) : undefined

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
