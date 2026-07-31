export const PORT = process.env.PORT || 5000
export const CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || ""
export const ENV_ENVIRONMENT = process.env.NODE_ENV

export const ENVIRONMENT = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_LIMIT_PROD: 100000,
  MAX_LIMIT_DEV: 100000,
} as const
