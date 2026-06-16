/** Converts an ISO timestamp to minutes-from-midnight for shift comparison. */
export function getMinutesFromDateTime(iso?: string | null): number | undefined {
  if (!iso) return undefined

  const date = new Date(iso)

  return date.getHours() * 60 + date.getMinutes()
}
