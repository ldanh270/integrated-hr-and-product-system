import { StatusPill } from "@/components/common/status-pill"
import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import {
  PART_TIME_AVAILABILITY_STATUS_LABELS,
  PART_TIME_AVAILABILITY_STATUS_VARIANTS,
} from "@/config/entities/part-time-availability.config"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types"
import { formatAvailabilityDaySummary } from "@/utils/attendance/part-time-availability.util"
import { getWeekDates } from "@/utils/attendance/get-week-dates"

import { ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

import { AdminPartTimeAvailabilityAssignDrawer } from "./admin-part-time-availability-assign-drawer"

interface AdminPartTimeAvailabilityCardProps {
  availability: IPartTimeWeeklyAvailability
  weekStart: Date
  weekStartKey: string
}

export function AdminPartTimeAvailabilityCard({
  availability,
  weekStart,
  weekStartKey,
}: AdminPartTimeAvailabilityCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const dayMap = useMemo(
    () => new Map(availability.days.map((day) => [day.dayOfWeek, day])),
    [availability.days],
  )
  const employeeName = availability.employee?.fullName ?? availability.employeeId

  return (
    <>
      <div className="flex w-full items-start justify-between gap-4 rounded-xl border border-border/80 bg-secondary/10 p-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <button
              type="button"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              // Name opens assign drawer — primary entry for per-day shift scheduling.
              onClick={() => setDrawerOpen(true)}
            >
              {employeeName}
            </button>
            <p className="text-xs text-muted-foreground">{availability.employee?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {/* One cell per weekday so admin scans the full week at a glance. */}
            {WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
              const weekDay = weekDates.find((entry) => entry.dayOfWeek === dayOfWeek)
              return (
                <div
                  key={dayOfWeek}
                  className="rounded-lg border border-border/50 bg-card/80 px-2 py-1.5"
                >
                  <p className="text-[10px] font-medium text-foreground">{weekDay?.shortDate}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatAvailabilityDaySummary(dayMap.get(dayOfWeek))}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill
            label={PART_TIME_AVAILABILITY_STATUS_LABELS[availability.status]}
            variant={PART_TIME_AVAILABILITY_STATUS_VARIANTS[availability.status]}
          />
          <button
            type="button"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Xếp ca cho ${employeeName}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AdminPartTimeAvailabilityAssignDrawer
        availability={availability}
        weekStart={weekStart}
        weekStartKey={weekStartKey}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
