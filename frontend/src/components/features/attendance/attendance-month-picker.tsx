import { Button } from "@/components/ui/button"
import { getMonthName } from "@/utils/attendance/get-month-name"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

interface AttendanceMonthPickerProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function AttendanceMonthPicker({ year, month, onPrev, onNext }: AttendanceMonthPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">
          {getMonthName(month)} {year}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
