/**
 * Central business constants for Capacity Copilot.
 * Keep forecast tuning here so formulas do not hide magic values in services/components.
 */
export const CAPACITY_COPILOT_RULES = {
  FULL_TIME_WEEKLY_HOURS: 40,
  DEFAULT_SKILL_MATCH_FACTOR: 1,
  DEFAULT_LOOKBACK_WEEKS: 3,
  MIN_LOOKBACK_WEEKS: 1,
  MAX_LOOKBACK_WEEKS: 12,
  VELOCITY_SAMPLE_TASK_LIMIT: 20,
  HIGH_RISK_GAP_RATIO: 0.2,
  MIN_HISTORY_WEEKS_FOR_MEDIUM_CONFIDENCE: 2,
  MIN_HISTORY_WEEKS_FOR_HIGH_CONFIDENCE: 3,
  DAYS_PER_WEEK: 7,
  MINUTES_PER_HOUR: 60,
  UNKNOWN_ROLE_CODE: "unknown",
  UNKNOWN_ROLE_NAME: "Chưa có role",
  DEAL_TARGET_PERCENT_MIN: 1,
  DEAL_TARGET_PERCENT_MAX: 100,
  // Weekly background refresh defaults: Monday 00:05, after employees usually submit next-week availability.
  WEEKLY_CRON_DAY_OF_WEEK: 1,
  WEEKLY_CRON_HOUR: 0,
  WEEKLY_CRON_MINUTE: 5,
  CRON_POLL_EXPRESSION: "* * * * *",
} as const

/** Confidence values returned by the Capacity Copilot API. */
export const CAPACITY_CONFIDENCE_LEVEL = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type CapacityConfidenceLevel =
  (typeof CAPACITY_CONFIDENCE_LEVEL)[keyof typeof CAPACITY_CONFIDENCE_LEVEL]
