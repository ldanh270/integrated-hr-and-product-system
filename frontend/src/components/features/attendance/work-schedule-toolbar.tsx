/** Controls employee filtering and week selection for the company work-schedule table. */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDateParam } from "@/utils/attendance/format-date-param"

import type { MouseEvent } from "react"

import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react"

type WeekMoveDirection = -1 | 1

const PREVIOUS_WEEK_DIRECTION: WeekMoveDirection = -1
const NEXT_WEEK_DIRECTION: WeekMoveDirection = 1

interface WorkScheduleToolbarProps {
  employeeSearch: string
  selectedDate: Date
  weekRangeLabel: string
  onEmployeeSearchChange: (value: string) => void
  onMoveWeek: (direction: WeekMoveDirection) => void
  onSelectedDateChange: (value: string) => void
}

export function WorkScheduleToolbar({
  employeeSearch,
  selectedDate,
  weekRangeLabel,
  onEmployeeSearchChange,
  onMoveWeek,
  onSelectedDateChange,
}: WorkScheduleToolbarProps) {
  const openDatePicker = (event: MouseEvent<HTMLInputElement>) => {
    try {
      event.currentTarget.showPicker()
    } catch {
      event.currentTarget.focus()
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">{weekRangeLabel}</span>
        <Input
          aria-label="Chọn ngày trong tuần làm việc"
          className="w-40 cursor-pointer"
          type="date"
          value={formatDateParam(selectedDate)}
          onClick={openDatePicker}
          onChange={(event) => {
            onSelectedDateChange(event.target.value)
          }}
        />
        <div className="relative w-72 max-w-full">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Tìm kiếm nhân viên trong lịch làm việc"
            className="pl-10"
            placeholder="Tìm tên, email hoặc mã nhân viên"
            value={employeeSearch}
            onChange={(event) => {
              onEmployeeSearchChange(event.target.value)
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Tuần trước"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => {
            onMoveWeek(PREVIOUS_WEEK_DIRECTION)
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Tuần sau"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => {
            onMoveWeek(NEXT_WEEK_DIRECTION)
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
