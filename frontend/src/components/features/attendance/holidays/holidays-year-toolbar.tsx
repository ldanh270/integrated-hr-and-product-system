import { Button } from "@/components/ui/button"

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react"

interface HolidaysYearToolbarProps {
  year: number
  isAdmin: boolean
  onPreviousYear: () => void
  onNextYear: () => void
  onCreate: () => void
}

export function HolidaysYearToolbar({
  year,
  isAdmin,
  onPreviousYear,
  onNextYear,
  onCreate,
}: HolidaysYearToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">Năm {year}</span>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Button size="sm" className="h-8 px-4" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Thêm ngày lễ
          </Button>
        ) : null}
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPreviousYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNextYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
