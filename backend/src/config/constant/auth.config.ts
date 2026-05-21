/**
 * Auth tokens configs
 */
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || ""
export const ACCESS_TOKEN_TTL = "15m"
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
