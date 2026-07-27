import { WEEKLY_SCHEDULE_PLANNING } from "@/configs/entities/attendance.config.ts"
import type { IShiftScheduleWithDays } from "@/types/shift-schedule.types.ts"
import type { IEmployeeShiftWithShift } from "@/types/shift.types.ts"
import {
  eachScheduleDate,
  formatScheduleDateKey,
  normalizeScheduleDate,
  resolveShiftFromSchedule,
} from "@/utils/schedule.util.ts"

export interface IPlannedWeekShift {
  shiftId: string
  isOverride: boolean
  shift: {
    id: string
    name: string
    startTime: number
    endTime: number
    gracePeriodMinutes: number
    gpsLat: number | null
    gpsLng: number | null
    gpsRadiusMeters: number | null
  }
}

/** One calendar day after resolving manual assignments and template fallback. */
export interface IPlannedWeekDay {
  date: string
  dayOfWeek: number
  shifts: IPlannedWeekShift[]
}

/** Seven-day schedule projection anchored at weekStart. */
export interface IPlannedWeek {
  weekStart: string
  days: IPlannedWeekDay[]
}

/** Maps a persisted employee assignment without losing override provenance. */
function mapEmployeeShift(row: IEmployeeShiftWithShift): IPlannedWeekShift {
  return {
    shiftId: row.shiftId,
    isOverride: row.isOverride,
    shift: {
      id: row.shift.id,
      name: row.shift.name,
      startTime: row.shift.startTime,
      endTime: row.shift.endTime,
      gracePeriodMinutes: row.shift.gracePeriodMinutes,
      gpsLat: row.shift.gpsLat,
      gpsLng: row.shift.gpsLng,
      gpsRadiusMeters: row.shift.gpsRadiusMeters,
    },
  }
}

/** Converts a template result into the same shape used by persisted assignments. */
function mapTemplateShift(
  shiftId: string,
  shift: NonNullable<ReturnType<typeof resolveShiftFromSchedule>>["shift"],
): IPlannedWeekShift | null {
  if (!shift) return null

  return {
    shiftId,
    isOverride: false,
    shift: {
      id: shift.id ?? shiftId,
      name: shift.name ?? "Ca làm",
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: WEEKLY_SCHEDULE_PLANNING.DEFAULT_GRACE_PERIOD_MINUTES,
      gpsLat: null,
      gpsLng: null,
      gpsRadiusMeters: null,
    },
  }
}

/** Merges daily EmployeeShift rows with weekly template fallback for calendar display. */
export function buildPlannedWeek(params: {
  weekStart: Date
  employeeShifts: IEmployeeShiftWithShift[]
  getScheduleForDate: (date: Date) => Promise<IShiftScheduleWithDays | null>
}): Promise<IPlannedWeek> {
  const { weekStart, employeeShifts, getScheduleForDate } = params
  const start = normalizeScheduleDate(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + WEEKLY_SCHEDULE_PLANNING.WEEK_END_OFFSET_DAYS)

  const shiftsByDate = new Map<string, IEmployeeShiftWithShift[]>()
  for (const row of employeeShifts) {
    const key = formatScheduleDateKey(new Date(row.assignedDate))
    const bucket = shiftsByDate.get(key) ?? []
    bucket.push(row)
    shiftsByDate.set(key, bucket)
  }

  return (async () => {
    const days: IPlannedWeekDay[] = []

    for (const date of eachScheduleDate(start, end)) {
      const dateKey = formatScheduleDateKey(date)
      const rows = shiftsByDate.get(dateKey) ?? []
      const overrideRows = rows.filter((row) => row.isOverride)
      // A manual override replaces every generated row for that date; templates are only fallback.
      const plannedRows = overrideRows.length > 0 ? overrideRows : rows

      let shifts: IPlannedWeekShift[] = plannedRows.map(mapEmployeeShift)

      if (shifts.length === 0) {
        const schedule = await getScheduleForDate(date)
        const resolved = resolveShiftFromSchedule(schedule, date)
        if (resolved?.shiftId) {
          const mapped = mapTemplateShift(resolved.shiftId, resolved.shift)
          if (mapped) shifts = [mapped]
        }
      }

      days.push({
        date: dateKey,
        dayOfWeek: date.getDay(),
        shifts,
      })
    }

    return {
      weekStart: formatScheduleDateKey(start),
      days,
    }
  })()
}
