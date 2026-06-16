/** Returns Monday 00:00 of the week containing the given date (ISO week start). */
export function getWeekStart(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)

  start.setDate(diff)
  start.setHours(0, 0, 0, 0)

  return start
}
