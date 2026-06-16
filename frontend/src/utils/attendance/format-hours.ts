/** Formats total minutes as a compact hours/minutes label (e.g. "8h 30m"). */
export function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
