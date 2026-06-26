/** Time-window constants for check-in/out grace periods and duration math. */
export const ATTENDANCE_TIME_RULES = {
  DEFAULT_WINDOW_MINUTES: 15,
  MINUTES_PER_DAY: 1440,
  MILLISECONDS_PER_MINUTE: 60000,
} as const

/** Earth-radius and conversion values for Haversine GPS distance checks. */
export const ATTENDANCE_GPS_RULES = {
  EARTH_RADIUS_METERS: 6371000,
  DEGREES_TO_RADIANS_DIVISOR: 180,
  MIN_GEOFENCE_RADIUS_METERS: 10,
} as const
