export const SYSTEM_CONFIG = {
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
  },
} as const

/**
 * Standard sorting directions
 */
export const SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
} as const

/**
 * Array of valid sorting directions
 */
export const SORT_ORDER_VALUES = [SORT_ORDER.ASC, SORT_ORDER.DESC] as const
