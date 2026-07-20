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
  DAYS_PER_WEEK: 7,
  MINUTES_PER_HOUR: 60,
  UNKNOWN_ROLE_CODE: "unknown",
  UNKNOWN_ROLE_NAME: "Chưa có role",
  DEAL_TARGET_PERCENT_MIN: 1,
  DEAL_TARGET_PERCENT_MAX: 100,
} as const
