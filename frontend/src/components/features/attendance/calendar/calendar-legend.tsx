import type { CalendarTab } from "@/config/rules/calendar.config"

interface CalendarLegendProps {
  activeTab: CalendarTab
  showAllShifts: boolean
}

export function CalendarLegend({ activeTab, showAllShifts }: CalendarLegendProps) {
  if (showAllShifts && activeTab === "planned") {
    return (
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
    )
  }

  if (activeTab === "actual") {
    return (
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
    )
  }

  return null
}
