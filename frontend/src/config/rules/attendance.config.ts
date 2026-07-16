/** Check-in/out grace windows — mirrored from backend attendance rules. */
export const ATTENDANCE_TIME_RULES = {
  DEFAULT_WINDOW_MINUTES: 15,
  MINUTES_PER_HOUR: 60,
  MINUTES_PER_DAY: 1440,
} as const

/** Shift form defaults and constraints mirrored from backend validation. */
export const WORKING_SHIFT_FORM_RULES = {
  TIME_INPUT_PATTERN: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
  DEFAULT_START_TIME: "08:00",
  DEFAULT_END_TIME: "17:00",
  DEFAULT_BREAK_START_TIME: "12:00",
  DEFAULT_BREAK_END_TIME: "13:00",
  DEFAULT_GRACE_PERIOD_MINUTES: 15,
  MIN_GRACE_PERIOD_MINUTES: 0,
  MAX_GRACE_PERIOD_MINUTES: 120,
  TABLE_COLUMN_COUNT: 8,
} as const

/** GPS geofence floor for shift setup UI — must stay in sync with backend. */
export const ATTENDANCE_GPS_RULES = {
  /** Minimum radius (m) before GPS jitter rejects valid onsite PT / full-time check-ins. */
  MIN_GEOFENCE_RADIUS_METERS: 10,
} as const
