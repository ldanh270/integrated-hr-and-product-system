/**
 * Frontend-only display/input constants for Capacity Copilot.
 * Backend validation remains the source of truth for accepted values.
 */
export const CAPACITY_COPILOT_RULES = {
  DEFAULT_LOOKBACK_WEEKS: 3,
  DAYS_PER_WEEK: 7,
  UNKNOWN_ROLE_CODE: "unknown",
  UNKNOWN_ROLE_NAME: "Chưa có role",
  DEAL_TARGET_PERCENT_MIN: 1,
  DEAL_TARGET_PERCENT_MAX: 100,
  DEAL_TARGET_PERCENT_PLACEHOLDER: "Ví dụ: 20",
} as const
