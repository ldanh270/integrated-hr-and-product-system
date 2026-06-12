export const PORT = process.env.PORT || 5000
export const CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || ""
export const ENV_ENVIRONMENT = process.env.NODE_ENV

export const ENVIRONMENT = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const
