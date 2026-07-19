/**
 * Inclusive calendar-day expansion from start → end (local midnight dates).
 */
export function expandDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)

  while (cursor <= last) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}
