import { Button } from "@/components/ui/button"
import {
  DAY_OF_WEEK_LABELS,
  WORK_WEEK_DISPLAY_DAY_ORDER,
} from "@/config/entities/attendance.config"
import { PART_TIME_AVAILABILITY_ASSIGN_VALIDATION } from "@/config/entities/part-time-availability.config"
import { useAssignPartTimeShifts } from "@/hooks/attendance/use-part-time-availability"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types"
import {
  buildDefaultPartTimeAssignments,
  collectPartTimeAssignmentIssues,
  flattenPartTimeAssignments,
  isPartTimeAvailabilityAssignable,
  type IPartTimeAssignmentDayForm,
} from "@/utils/attendance/part-time-availability.util"
import { getWeekDates } from "@/utils/attendance/get-week-dates"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AdminPartTimeAssignDayColumn } from "./admin-part-time-assign-day-column"

import { Loader2 } from "lucide-react"

interface AdminPartTimeAvailabilityAssignPanelProps {
  availability: IPartTimeWeeklyAvailability
  weekStart: Date
  weekStartKey: string
  onAssigned?: () => void
}

interface AssignPanelFormProps extends AdminPartTimeAvailabilityAssignPanelProps {
  canAssign: boolean
  weekDates: ReturnType<typeof getWeekDates>
  dayMap: Map<number, IPartTimeWeeklyAvailability["days"][number]>
}

function AdminPartTimeAvailabilityAssignPanelForm({
  availability,
  weekStartKey,
  onAssigned,
  canAssign,
  weekDates,
  dayMap,
}: AssignPanelFormProps) {
  const assignMutation = useAssignPartTimeShifts(weekStartKey)
  const [assignments, setAssignments] = useState<IPartTimeAssignmentDayForm[]>(() =>
    buildDefaultPartTimeAssignments(availability),
  )

  const validationIssues = useMemo(
    () => collectPartTimeAssignmentIssues(assignments, dayMap, DAY_OF_WEEK_LABELS),
    [assignments, dayMap],
  )

  const hasValidationErrors = validationIssues.length > 0

  const handleAssign = async () => {
    if (hasValidationErrors) {
      toast.error(validationIssues[0] ?? PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.CHECK_ASSIGNMENTS)
      return
    }

    try {
      const result = await assignMutation.mutateAsync({
        id: availability.id,
        assignments: flattenPartTimeAssignments(assignments),
      })
      toast.success(`Đã xếp ${result.assigned} ca, bỏ qua ${result.skipped} ngày`)
      onAssigned?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xếp ca")
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="overflow-x-auto">
          <div className="min-w-[77rem] grid grid-cols-7 gap-3 pb-2">
            {WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
              const assignment = assignments.find((entry) => entry.dayOfWeek === dayOfWeek)
              const weekDay = weekDates.find((entry) => entry.dayOfWeek === dayOfWeek)

              if (!assignment) return null

              return (
                <AdminPartTimeAssignDayColumn
                  key={dayOfWeek}
                  dayLabel={DAY_OF_WEEK_LABELS.get(dayOfWeek) ?? ""}
                  shortDate={weekDay?.shortDate}
                  availabilityDay={dayMap.get(dayOfWeek)}
                  assignment={assignment}
                  disabled={!canAssign}
                  onChange={(next) => {
                    setAssignments((current) =>
                      current.map((entry) =>
                        entry.dayOfWeek === dayOfWeek ? next : entry,
                      ),
                    )
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Chọn Làm/Không làm từng ngày. Giờ xếp ca phải nằm trong khung rảnh nhân viên đã gửi.
        </p>
        <Button
          type="button"
          className="rounded-full"
          disabled={!canAssign || assignMutation.isPending || hasValidationErrors}
          onClick={() => {
            void handleAssign()
          }}
        >
          {assignMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Xếp ca tuần này
        </Button>
      </div>
    </>
  )
}

export function AdminPartTimeAvailabilityAssignPanel({
  availability,
  weekStart,
  weekStartKey,
  onAssigned,
}: AdminPartTimeAvailabilityAssignPanelProps) {
  const weekDates = getWeekDates(weekStart)
  // Only submitted (or legacy approved) rows can receive shift assignments.
  const canAssign = isPartTimeAvailabilityAssignable(availability.status)

  const dayMap = useMemo(
    () => new Map(availability.days.map((day) => [day.dayOfWeek, day])),
    [availability.days],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-6 pb-5 pt-14 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
          {(availability.employee?.fullName ?? availability.employeeId).substring(0, 2)}
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-lg font-bold text-foreground">
            {availability.employee?.fullName ?? availability.employeeId}
          </p>
          <p className="text-sm text-muted-foreground">{availability.employee?.email}</p>
          {availability.note ? (
            <div className="mt-2.5 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
              <span className="font-semibold">Ghi chú:</span> {availability.note}
            </div>
          ) : null}
        </div>
      </div>

      <AdminPartTimeAvailabilityAssignPanelForm
        // Switching employee must reset assign form — slots are per availability record.
        key={availability.id}
        availability={availability}
        weekStart={weekStart}
        weekStartKey={weekStartKey}
        onAssigned={onAssigned}
        canAssign={canAssign}
        weekDates={weekDates}
        dayMap={dayMap}
      />
    </div>
  )
}
