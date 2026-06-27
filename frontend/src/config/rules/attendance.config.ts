/** Check-in/out grace windows — mirrored from backend attendance rules. */
export const ATTENDANCE_TIME_RULES = {
  DEFAULT_WINDOW_MINUTES: 15,
  MINUTES_PER_DAY: 1440,
} as const

/** GPS geofence floor for shift setup UI — must stay in sync with backend. */
export const ATTENDANCE_GPS_RULES = {
  /** Minimum radius (m) before GPS jitter rejects valid onsite PT / full-time check-ins. */
  MIN_GEOFENCE_RADIUS_METERS: 10,
} as const
