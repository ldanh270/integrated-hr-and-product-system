/** Time-window constants for check-in/out grace periods and duration math. */
export const ATTENDANCE_TIME_RULES = {
  TIME_ZONE: "Asia/Bangkok",
  UTC_OFFSET_MINUTES: 420,
  DEFAULT_WINDOW_MINUTES: 15,
  /** Canonical conversion used by attendance totals and payroll formula context. */
  MINUTES_PER_HOUR: 60,
  MINUTES_PER_DAY: 1440,
  MILLISECONDS_PER_MINUTE: 60000,
  MILLISECONDS_PER_DAY: 86_400_000,
} as const

/** Bounded workforce load for the admin attendance matrix. */
export const ATTENDANCE_MATRIX_RULES = {
  MAX_EMPLOYEES: 10000,
  CHECK_IN_GRACE_MINUTES: 5,
  DAYS_PER_WEEK: 7,
  MONDAY_OFFSET_BASE: 6,
} as const

/** Working-shift boundaries stored as minutes from local midnight. */
export const WORKING_SHIFT_RULES = {
  MIN_MINUTES_FROM_MIDNIGHT: 0,
  MAX_MINUTES_FROM_MIDNIGHT: 1440,
  MAX_GRACE_PERIOD_MINUTES: 120,
  TIME_INPUT_PATTERN: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
} as const

/** Default onsite attendance point: FPT University Da Nang campus. */
export const DEFAULT_ATTENDANCE_LOCATION = {
  LATITUDE: 15.96751,
  LONGITUDE: 108.26052,
  RADIUS_METERS: 500,
} as const

/** Earth-radius and conversion values for Haversine GPS distance checks. */
export const ATTENDANCE_GPS_RULES = {
  EARTH_RADIUS_METERS: 6371000,
  DEGREES_TO_RADIANS_DIVISOR: 180,
  /** Floor for shift geofence + onsite PT check-in — avoids GPS drift false negatives. */
  MIN_GEOFENCE_RADIUS_METERS: 10,
} as const
