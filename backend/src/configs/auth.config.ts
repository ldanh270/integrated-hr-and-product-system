/**
 * Auth tokens configs
 */
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || ""
export const ACCESS_TOKEN_TTL = 24 * 60 * 60 * 1000 // 1 day
