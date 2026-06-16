export const SYSTEM_CONFIG = {
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
    LOCATION_CACHE: "userLocation",
  },
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    SMALL_LIMIT: 10,
    MAX_VISIBLE_PAGES: 5,
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

export const COMMON_TEXTS = {
  NOT_AVAILABLE: "N/A",
  SYSTEM: "Hệ thống",
} as const
