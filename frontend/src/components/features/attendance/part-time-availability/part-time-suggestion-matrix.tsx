import { Button } from "@/components/ui/button"
import {
  DAY_OF_WEEK_LABELS,
  WORK_WEEK_DISPLAY_DAY_ORDER,
} from "@/config/entities/attendance.config"
import { useAssignPartTimeShifts } from "@/hooks/attendance/use-part-time-availability"
import type {
  IPartTimeUnassignedGap,
  ISuggestPartTimeCoverage,
  ISuggestPartTimeEmployeeSuggestion,
} from "@/types/part-time-availability.types"

import { useMemo, useState } from "react"

import { toast } from "sonner"

interface PartTimeSuggestionMatrixProps {
  weekStartKey: string
  suggestions: ISuggestPartTimeEmployeeSuggestion[]
  coverage: ISuggestPartTimeCoverage[]
  gaps: IPartTimeUnassignedGap[]
}

/** Team review surface. Selection is explicit; persistence still uses assign-shifts. */
export function PartTimeSuggestionMatrix({
  weekStartKey,
  suggestions,
  coverage,
  gaps,
}: PartTimeSuggestionMatrixProps) {
  const assignMutation = useAssignPartTimeShifts(weekStartKey)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(suggestions.map((suggestion) => suggestion.availabilityId)),
  )
  const assignmentsByEmployeeDay = useMemo(() => {
    const result = new Map<string, string>()
    for (const suggestion of suggestions) {
      for (const assignment of suggestion.assignments) {
        const key = `${suggestion.availabilityId}:${assignment.dayOfWeek}`
        const existing = result.get(key)
        const label = `${assignment.startTime}–${assignment.endTime}`
        result.set(key, existing ? `${existing}, ${label}` : label)
      }
    }
    return result
  }, [suggestions])

  /** Toggles a single employee in/out of the confirmed set. */
  const toggle = (availabilityId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(availabilityId)) next.delete(availabilityId)
      else next.add(availabilityId)
      return next
    })
  }

  /**
   * Bulk-confirms all selected suggestions via assign-shifts mutations in parallel.
   * Each selected employee is assigned independently so partial failures are visible.
   */
  const confirmSelected = async () => {
    const selected = suggestions.filter((item) => selectedIds.has(item.availabilityId))
    if (selected.length === 0) return
    try {
      await Promise.all(
        selected.map((suggestion) =>
          assignMutation.mutateAsync({
            id: suggestion.availabilityId,
            suggestionDecision: "accepted",
            assignments: suggestion.assignments.map((assignment) => ({
              dayOfWeek: assignment.dayOfWeek,
              startTime: assignment.startTime,
              endTime: assignment.endTime,
            })),
          }),
        ),
      )
      toast.success(`Đã xác nhận ca cho ${selected.length} nhân viên`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xác nhận gợi ý")
    }
  }

  return (
    <section
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      data-testid="pt-suggestion-matrix"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ma trận gợi ý cả đội</h3>
          <p className="text-xs text-muted-foreground">
            Bỏ chọn nhân viên không muốn áp dụng; mở card bên dưới để sửa chi tiết.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full"
          disabled={selectedIds.size === 0 || assignMutation.isPending}
          onClick={() => {
            void confirmSelected()
          }}
          data-testid="confirm-selected-suggestions"
        >
          Xác nhận {selectedIds.size} nhân viên
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Chọn</th>
              <th className="px-3 py-2 text-left">Nhân viên</th>
              {WORK_WEEK_DISPLAY_DAY_ORDER.map((day) => (
                <th key={day} className="px-3 py-2 text-left">
                  {DAY_OF_WEEK_LABELS.get(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suggestions.map((suggestion) => (
              <tr key={suggestion.availabilityId} className="border-t border-border">
                <td className="px-3 py-2">
                  <input
                    className="h-4 w-4 rounded-full accent-primary"
                    type="checkbox"
                    checked={selectedIds.has(suggestion.availabilityId)}
                    onChange={() => toggle(suggestion.availabilityId)}
                    aria-label={`Chọn ${suggestion.employeeName}`}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                  {suggestion.employeeName}
                  <span className="ml-2 text-muted-foreground">{suggestion.score}</span>
                </td>
                {WORK_WEEK_DISPLAY_DAY_ORDER.map((day) => (
                  <td key={day} className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {assignmentsByEmployeeDay.get(`${suggestion.availabilityId}:${day}`) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {coverage.map((item) => (
          <span
            key={`${item.shiftId}:${item.dayOfWeek}`}
            className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground"
          >
            {DAY_OF_WEEK_LABELS.get(item.dayOfWeek)} {item.shiftName}: {item.assignedCount}/
            {item.requiredCount}
          </span>
        ))}
        {gaps.map((gap) => (
          <span
            key={`${gap.shiftId}:${gap.dayOfWeek}`}
            className="rounded-full bg-destructive/10 px-3 py-1 text-destructive"
          >
            Thiếu {gap.missingCount} · {DAY_OF_WEEK_LABELS.get(gap.dayOfWeek)} {gap.shiftName}
          </span>
        ))}
      </div>
    </section>
  )
}
