/**
 * Overnight shifts cannot be expressed in a single weekday slot, so callers reject them before range checks.
 */
export function isOvernightShift(shift: { startTime: number; endTime: number }): boolean {
  return shift.endTime < shift.startTime
}
