import { Button } from "@/components/ui/button"
import { getWeekStart } from "@/utils/attendance/get-week-start"

import { useRef } from "react"

import { Calendar } from "lucide-react"

interface WeekPickerActionsProps {
  weekStartIso: string
  weekRangeLabel: string
  onWeekStartChange: (weekStart: Date) => void
}

export function WeekPickerActions({
  weekStartIso,
  weekRangeLabel,
  onWeekStartChange,
}: WeekPickerActionsProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)

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

          onWeekStartChange(getWeekStart(new Date(event.target.value)))
        }}
        className="sr-only"
        aria-label="Chọn tuần làm việc"
      />
      <Button
        size="sm"
        className="h-8 rounded-full px-4"
        onClick={() => {
          onWeekStartChange(getWeekStart(new Date()))
        }}
      >
        Hôm nay
      </Button>
    </>
  )
}
