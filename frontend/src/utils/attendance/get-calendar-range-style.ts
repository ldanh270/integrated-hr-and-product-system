const CALENDAR_START_HOUR = 6
const CALENDAR_END_HOUR = 24
const MINUTES_PER_HOUR = 60
const CALENDAR_START_MINUTES = CALENDAR_START_HOUR * MINUTES_PER_HOUR
const CALENDAR_END_MINUTES = CALENDAR_END_HOUR * MINUTES_PER_HOUR
const CALENDAR_TOTAL_MINUTES = CALENDAR_END_MINUTES - CALENDAR_START_MINUTES

/** Maps shift start/end minutes to top/height percentages within the 06:00–24:00 calendar grid. */
export function getCalendarRangeStyle(
  startTime: number,
  endTime: number,
): { top: string; height: string } | undefined {
  const normalizedEndTime = endTime <= startTime ? endTime + 24 * MINUTES_PER_HOUR : endTime
  const startMinutes = Math.max(startTime, CALENDAR_START_MINUTES)
  const endMinutes = Math.min(normalizedEndTime, CALENDAR_END_MINUTES)

  if (endMinutes <= startMinutes) return undefined

  const top = ((startMinutes - CALENDAR_START_MINUTES) / CALENDAR_TOTAL_MINUTES) * 100
  const height = ((endMinutes - startMinutes) / CALENDAR_TOTAL_MINUTES) * 100

  return {
    top: `${top}%`,
    height: `${height}%`,
  }
}
