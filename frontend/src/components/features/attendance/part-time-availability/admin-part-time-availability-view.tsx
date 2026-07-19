import { EmptyState, PageCard, SectionHeader } from "@/components/common"
import { AdminPartTimeAvailabilityCard } from "@/components/features/attendance/part-time-availability/admin-part-time-availability-card"
import { PartTimeSuggestionMatrix } from "@/components/features/attendance/part-time-availability/part-time-suggestion-matrix"
import { WeekPickerActions } from "@/components/features/attendance/calendar/week-picker-actions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DAY_OF_WEEK_LABELS } from "@/config/entities/attendance.config"
import {
  PART_TIME_AVAILABILITY_ASSIGN_LABELS,
  PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES,
} from "@/config/entities/part-time-availability.config"
import {
  usePartTimeAvailabilityList,
  useSuggestPartTimeShifts,
} from "@/hooks/attendance/use-part-time-availability"
import type { ISuggestPartTimeShiftsResult } from "@/types/part-time-availability.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import {
  getEarliestRequestableWeekStart,
} from "@/utils/attendance/part-time-availability.util"

import { ChevronLeft, ChevronRight, Sparkles, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

/** Admin page — week navigation, suggest shifts, assignable-availability count, card list. */
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
  const suggestMutation = useSuggestPartTimeShifts(weekStartKey)
  const [suggestResult, setSuggestResult] = useState<ISuggestPartTimeShiftsResult | null>(null)

  // Only submitted/approved rows are actionable for shift assignment.
  const assignableItems = useMemo(
    () => items.filter((item) => PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(item.status)),
    [items],
  )

  const suggestionByAvailabilityId = useMemo(() => {
    const map = new Map(
      (suggestResult?.suggestions ?? []).map((suggestion) => [
        suggestion.availabilityId,
        suggestion,
      ]),
    )
    return map
  }, [suggestResult])

  const coverageSummary = useMemo(() => {
    if (!suggestResult) return null
    return suggestResult.coverage
      .map((item) => {
        const label = DAY_OF_WEEK_LABELS.get(item.dayOfWeek) ?? `Ngày ${item.dayOfWeek}`
        return `${label} ${item.shiftName} ${item.assignedCount}/${item.requiredCount}`
      })
      .join(" · ")
  }, [suggestResult])

  const handleWeekStartChange = (nextWeekStart: Date) => {
    setWeekStart(getWeekStart(nextWeekStart))
    setSuggestResult(null)
  }

  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * 7)
    handleWeekStartChange(next)
  }

  const handleSuggest = async () => {
    if (assignableItems.length === 0) {
      toast.error(PART_TIME_AVAILABILITY_ASSIGN_LABELS.SUGGEST_EMPTY)
      return
    }

    try {
      const result = await suggestMutation.mutateAsync()
      setSuggestResult(result)
      toast.success(PART_TIME_AVAILABILITY_ASSIGN_LABELS.SUGGEST_SUCCESS)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo gợi ý xếp ca")
    }
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
              size="sm"
              className="rounded-full"
              disabled={isLoading || suggestMutation.isPending || assignableItems.length === 0}
              onClick={() => {
                void handleSuggest()
              }}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.SUGGEST}
            </Button>
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
            {isLoading ? "Đang tải..." : `${assignableItems.length} nhân viên đã gửi lịch rảnh tuần này`}
          </span>
        </div>
        {coverageSummary ? (
          <p className="pl-6 text-foreground/80">
            Coverage gợi ý: {coverageSummary}
          </p>
        ) : null}
      </div>

      {suggestResult ? (
        <PartTimeSuggestionMatrix
          weekStartKey={weekStartKey}
          suggestions={suggestResult.suggestions}
          coverage={suggestResult.coverage}
          gaps={suggestResult.unassignedGaps}
        />
      ) : null}

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
              suggestion={suggestionByAvailabilityId.get(availability.id)}
            />
          ))}
        </div>
      )}
    </PageCard>
  )
}
