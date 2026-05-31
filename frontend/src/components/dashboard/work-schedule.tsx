import { Calendar } from "lucide-react"
import { PageCard, SectionHeader, EmptyState } from "@/components/common"

/**
 * WorkSchedule component
 * Renders the weekly shift planner calendar and the task list.
 * Consumes common PageCard, SectionHeader, EmptyState primitives.
 */
export default function WorkSchedule() {
  const days = [
    { label: "Thứ 2", date: "25/05" },
    { label: "Thứ 3", date: "26/05" },
    { label: "Thứ 4", date: "27/05" },
    { label: "Thứ 5", date: "28/05" },
    { label: "Thứ 6", date: "29/05" },
    { label: "Thứ 7", date: "30/05" },
    { label: "CN", date: "31/05" },
  ]

  const hours = Array.from({ length: 11 }, (_, i) => `${i + 7}:00`)

  return (
    <div className="space-y-4">
      {/* Task List Card */}
      <PageCard>
        <SectionHeader title="Việc cần làm" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-muted-foreground font-semibold">
            <thead>
              <tr className="border-b border-border/65">
                <th className="py-2 pr-4">Mã công việc</th>
                <th className="py-2 pr-4">Tên công việc</th>
                <th className="py-2 pr-4">Tiến độ</th>
                <th className="py-2 pr-4">Trạng thái</th>
                <th className="py-2">Ngày bắt đầu</th>
              </tr>
            </thead>
          </table>
          <EmptyState />
        </div>
      </PageCard>

      {/* Weekly Calendar Card */}
      <PageCard>
        <SectionHeader
          title="Lịch làm việc"
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                <Calendar size={12} />
                <span>25/05 – 31/05/2026</span>
              </div>
              <button className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer active:scale-95">
                Hôm nay
              </button>
            </div>
          }
        />

        {/* Weekly Grid */}
        <div className="overflow-x-auto rounded-lg border border-border/70">
          <div className="min-w-[640px] divide-y divide-border/60">
            {/* Header row */}
            <div className="grid grid-cols-8 bg-secondary/40 py-1.5 px-2 text-[11px] font-bold text-muted-foreground text-center">
              <div className="text-left font-medium text-xs">Giờ</div>
              {days.map((day, idx) => (
                <div key={idx} className={day.label === "Thứ 5" ? "text-primary" : ""}>
                  <div className="text-[10px] uppercase opacity-75">{day.label}</div>
                  <div className="text-[11px] mt-0.5">{day.date}</div>
                </div>
              ))}
            </div>

            {/* Time slot rows */}
            <div className="divide-y divide-border/40 bg-card">
              {hours.map((hour, hIdx) => (
                <div key={hIdx} className="grid grid-cols-8 items-stretch min-h-[40px] text-xs">
                  {/* Time label */}
                  <div className="flex items-center justify-start px-2 text-[10px] font-semibold text-muted-foreground border-r border-border/45">
                    {hour}
                  </div>

                  {/* Weekday slots */}
                  {Array.from({ length: 7 }).map((_, dIdx) => {
                    const isWeekday = dIdx < 5
                    const showShift = isWeekday && hIdx >= 2 && hIdx <= 9
                    return (
                      <div
                        key={dIdx}
                        className={`relative p-0.5 border-r border-border/45 last:border-0 ${
                          dIdx === 3 ? "bg-primary/5" : ""
                        }`}
                      >
                        {showShift && hIdx === 2 && (
                          <div className="absolute inset-x-0.5 top-1 bottom-0 z-10 rounded-lg bg-blue-500/10 border-l-4 border-blue-500 px-1.5 py-1 text-[9px] font-bold text-blue-700 dark:text-blue-400 leading-tight">
                            <div>CHC</div>
                            <div className="opacity-85 mt-0.5">08:30–17:30</div>
                          </div>
                        )}
                        {showShift && hIdx > 2 && hIdx < 9 && (
                          <div className="absolute inset-x-0.5 inset-y-0 z-10 bg-blue-500/10 border-l-4 border-blue-500" />
                        )}
                        {showShift && hIdx === 9 && (
                          <div className="absolute inset-x-0.5 top-0 bottom-1 z-10 bg-blue-500/10 border-l-4 border-blue-500 rounded-b-lg" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  )
}
