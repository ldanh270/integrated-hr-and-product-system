/** Formats a date as DD/MM for compact calendar headers. */
export function formatShortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${day}/${month}`
}
