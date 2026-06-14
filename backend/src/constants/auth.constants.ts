export const AUTH_ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  INVALID_CREDENTIALS: "Wrong username or password",
  ACCOUNT_DISABLED: "Account is disabled or inactive",
  INVALID_TOKEN: "Invalid token",
  TOKEN_EXPIRED: "Reset link has expired",
} as const

export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
} as const
