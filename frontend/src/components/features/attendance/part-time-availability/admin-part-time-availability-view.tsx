import { EmptyState, PageCard, SectionHeader } from "@/components/common"
import { WeekPickerActions } from "@/components/features/attendance/calendar/week-picker-actions"
import { AdminPartTimeAvailabilityCard } from "@/components/features/attendance/part-time-availability/admin-part-time-availability-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES } from "@/config/entities/part-time-availability.config"
import { usePartTimeAvailabilityList } from "@/hooks/attendance/use-part-time-availability"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import { getEarliestRequestableWeekStart } from "@/utils/attendance/part-time-availability.util"

import { useMemo, useState } from "react"

import { ChevronLeft, ChevronRight, Users } from "lucide-react"

const DAYS_PER_WEEK = 7

/** Admin page — week navigation, assignable-availability count, manual assignment card list. */
export function AdminPartTimeAvailabilityView() {
  // Shift assignment starts from the upcoming week, not historical weeks.
  const earliestWeekStart = useMemo(() => getEarliestRequestableWeekStart(), [])
  const earliestWeekStartKey = formatDateParam(earliestWeekStart)

  const [weekStart, setWeekStart] = useState(() => getEarliestRequestableWeekStart())
  const weekStartKey = formatDateParam(weekStart)
  // Block "Tuần trước" before earliest assignable week (same rule as employee submit).
  const canGoToPreviousWeek = weekStart.getTime() > earliestWeekStart.getTime()
  const weekDays = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(weekDays), [weekDays])
  const { data: items = [], isLoading } = usePartTimeAvailabilityList(weekStartKey)

  // Only submitted/approved rows are actionable for shift assignment.
  const assignableItems = useMemo(
    () => items.filter((item) => PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(item.status)),
    [items],
  )

  const handleWeekStartChange = (nextWeekStart: Date) => {
    setWeekStart(getWeekStart(nextWeekStart))
  }

  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * DAYS_PER_WEEK)
    handleWeekStartChange(next)
  }

  return (
    <PageCard padding="lg" className="space-y-5">
      <SectionHeader
        title="Xếp ca theo lịch rảnh"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={!canGoToPreviousWeek}
              onClick={() => {
                shiftWeek(-1)
              }}
              aria-label="Tuần trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <WeekPickerActions
              weekStartIso={weekStartKey}
              weekRangeLabel={weekRangeLabel}
              minWeekStartIso={earliestWeekStartKey}
              defaultWeekStart={earliestWeekStart}
              defaultWeekLabel="Tuần kế tiếp"
              onWeekStartChange={handleWeekStartChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => {
                shiftWeek(1)
              }}
              aria-label="Tuần sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 rounded-lg bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span>
            {isLoading
              ? "Đang tải..."
              : `${assignableItems.length} nhân viên đã gửi lịch rảnh tuần này`}
          </span>
        </div>
        <p className="pl-6 text-foreground/80">
          AI chính đã chuyển sang Project Overview để dự đoán capacity theo project/role.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : assignableItems.length === 0 ? (
        <EmptyState message="Chưa có lịch rảnh trong tuần này" />
      ) : (
        <div className="space-y-4">
          {assignableItems.map((availability) => (
            <AdminPartTimeAvailabilityCard
              key={availability.id}
              availability={availability}
              weekStart={weekStart}
              weekStartKey={weekStartKey}
            />
          ))}
        </div>
      )}
    </PageCard>
  )
}
