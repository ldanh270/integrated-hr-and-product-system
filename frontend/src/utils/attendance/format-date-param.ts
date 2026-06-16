/** Formats a date as YYYY-MM-DD for API query params and map keys. */
export function formatDateParam(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${date.getFullYear()}-${month}-${day}`
}
