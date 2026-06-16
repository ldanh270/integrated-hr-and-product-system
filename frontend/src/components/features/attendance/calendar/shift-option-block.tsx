import { cn, minutesToTime } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"
import { getCalendarRangeStyle } from "@/utils/attendance/get-calendar-range-style"

interface ShiftOptionBlockProps {
  shift: IWorkingShift
  isAssigned: boolean
}

export function ShiftOptionBlock({ shift, isAssigned }: ShiftOptionBlockProps) {
  const shiftStyle = getCalendarRangeStyle(shift.startTime, shift.endTime)

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
