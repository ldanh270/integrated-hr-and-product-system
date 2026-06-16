/** Returns a new date shifted by the given number of calendar days. */
export function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + days)

  return nextDate
}
