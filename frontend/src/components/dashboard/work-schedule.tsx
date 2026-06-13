import { EmptyState, PageCard, SectionHeader } from "@/components/common"
import { schedulesApi } from "@/lib/api/attendance.api"
import { minutesToTime } from "@/lib/utils"

import { useQuery } from "@tanstack/react-query"
import { Calendar, Loader2 } from "lucide-react"

/**
 * getCurrentWeekDates — Helper to get current week's dates from Monday to Sunday.
 * Used for rendering the weekly calendar grid.
 * @returns Array of objects containing label (Thứ X/CN), formatted date (DD/MM), and numeric dayOfWeek.
 */
function getCurrentWeekDates() {
  const now = new Date()
  const day = now.getDay() // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust to get Monday
  const monday = new Date(now.setDate(diff))

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      label: d.getDay() === 0 ? "CN" : `Thứ ${d.getDay() + 1}`,
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      dayOfWeek: d.getDay(),
    }
  })
}

/**
 * WorkSchedule — Dashboard component that renders the weekly shift planner calendar and the task list.
 * Fetches real schedule data for the authenticated user.
 */
export default function WorkSchedule() {
  // weekDays: Array of date information for the current week
  const weekDays = getCurrentWeekDates()
  // hours: Time slots from 7:00 to 17:00
  const hours = Array.from({ length: 11 }, (_, i) => `${i + 7}:00`)

  /**
   * useQuery — Fetches the authenticated user's planned shift schedule.
   * Calls API: schedulesApi.getMy
   * Response: ISchedule containing validFrom/To and an array of IScheduleDay.
   */
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["my-schedule"],
    queryFn: () => schedulesApi.getMy(),
  })

  // weekRangeLabel: Descriptive label for the current week (e.g., "25/05 – 31/05/2026")
  const weekRangeLabel = `${weekDays[0].date} – ${weekDays[6].date}/${new Date().getFullYear()}`

  return (
    <div className="space-y-4">
      {/* Task List Card — Placeholder for upcoming work items */}
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
          <EmptyState message="Không có công việc nào được giao trong tuần này" />
        </div>
      </PageCard>

      {/* Weekly Calendar Card — Visual representation of assigned shifts */}
      <PageCard>
        <SectionHeader
          title="Lịch làm việc"
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                <Calendar size={12} />
                <span>{weekRangeLabel}</span>
              </div>
              <button className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer active:scale-95">
                Hôm nay
              </button>
            </div>
          }
        />

        {/* Weekly Grid container */}
        <div className="overflow-x-auto rounded-lg border border-border/70 min-h-60 relative">
          {isLoading ? (
            // Loading Overlay when fetching schedule data
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-xs">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !schedule || schedule.days.length === 0 ? (
            // Empty State when no schedule days are returned
            <div className="py-12">
              <EmptyState message="Bạn chưa được phân ca làm việc trong tuần này" />
            </div>
          ) : (
            <div className="min-w-160 divide-y divide-border/60">
              {/* Header row containing day labels and dates */}
              <div className="grid grid-cols-8 bg-secondary/40 py-1.5 px-2 text-[11px] font-bold text-muted-foreground text-center">
                <div className="text-left font-medium text-xs">Giờ</div>
                {weekDays.map((day, idx) => (
                  <div key={idx} className={day.dayOfWeek === new Date().getDay() ? "text-primary" : ""}>
                    <div className="text-[10px] uppercase opacity-75">{day.label}</div>
                    <div className="text-[11px] mt-0.5">{day.date}</div>
                  </div>
                ))}
              </div>

              {/* Time slot rows for the visual calendar grid */}
              <div className="divide-y divide-border/40 bg-card">
                {hours.map((hour, hIdx) => {
                  const currentHour = hIdx + 7
                  return (
                    <div key={hIdx} className="grid grid-cols-8 items-stretch min-h-10 text-xs">
                      {/* Leftmost column showing the time label (e.g., 08:00) */}
                      <div className="flex items-center justify-start px-2 text-[10px] font-semibold text-muted-foreground border-r border-border/45">
                        {hour}
                      </div>

                      {/* Individual day slots (Mon-Sun) */}
                      {weekDays.map((day, dIdx) => {
                        // scheduleDay: Look up if there's a shift defined for this day of week
                        const scheduleDay = schedule.days.find((sd) => sd.dayOfWeek === day.dayOfWeek)
                        const shift = scheduleDay?.shift

                        if (!shift) {
                          return (
                            <div
                              key={dIdx}
                              className="relative p-0.5 border-r border-border/45 last:border-0"
                            />
                          )
                        }

                        // Determine if this time slot (hour) falls within the shift range
                        const startHour = shift.startTime / 60
                        const endHour = shift.endTime / 60

                        const isStart = currentHour === Math.floor(startHour)
                        const isMiddle = currentHour > Math.floor(startHour) && currentHour < Math.floor(endHour)
                        const isEnd = currentHour === Math.floor(endHour)

                        return (
                          <div
                            key={dIdx}
                            className={`relative p-0.5 border-r border-border/45 last:border-0 ${
                              day.dayOfWeek === new Date().getDay() ? "bg-primary/5" : ""
                            }`}
                          >
                            {isStart && (
                              // Render the shift start block with name and time
                              <div className="absolute inset-x-0.5 top-1 bottom-0 z-10 rounded-t-lg bg-info/10 border-l-4 border-info px-1.5 py-1 text-[9px] font-bold text-info-foreground leading-tight">
                                <div className="truncate">{shift.name}</div>
                                <div className="opacity-85 mt-0.5">
                                  {minutesToTime(shift.startTime)}–{minutesToTime(shift.endTime)}
                                </div>
                              </div>
                            )}
                            {isMiddle && (
                              // Render a continuing shift block
                              <div className="absolute inset-x-0.5 inset-y-0 z-10 bg-info/10 border-l-4 border-info" />
                            )}
                            {isEnd && (
                              // Render the shift end block
                              <div className="absolute inset-x-0.5 top-0 bottom-1 z-10 bg-info/10 border-l-4 border-info rounded-b-lg" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </PageCard>
    </div>
  )
}
