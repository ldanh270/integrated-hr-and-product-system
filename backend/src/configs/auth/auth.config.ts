export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || ""
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || ""
export const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET || ACCESS_TOKEN_SECRET
/** 32-byte base64 key used to encrypt third-party OAuth credentials at rest. */
export const OAUTH_CREDENTIAL_ENCRYPTION_KEY = process.env.OAUTH_CREDENTIAL_ENCRYPTION_KEY || ""

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 phút
export const ACCESS_TOKEN_TTL = "15m"
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 ngày
export const REFRESH_TOKEN_TTL = "7d"
export const ACTIVITY_LOG_TTL = 90 * 24 * 60 * 60 * 1000 // 90 days
export const PASSWORD_RESET_TTL = 5 * 60 * 1000 // 5 mins
export const ACCOUNT_LOCK_TTL = 5 * 60 * 1000 // 5 mins

export const REGEX = {
  // MongoDB ObjectId is no longer used, we use Postgres UUID

  // Only contain lowercase letters, numbers, and underscores (_) and dots (.)
  USERNAME: /^[a-z0-9_.]+$/,

  // Email validation regex
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Minimum 8 characters, including at least 1 uppercase, 1 lowercase, 1 number and 1 special character.
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Can include + at first character, length from 10 to 15 characters
  PHONE: /^\+?[0-9]{10,15}$/,
}

export const PASSWORD_RESET_STATUS = {
  PENDING: "pending",
  USED: "used",
  EXPIRED: "expired",
  // Legacy statuses — not used by the new automated email reset flow
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

export const PASSWORD_RESET_STATUSES = [
  PASSWORD_RESET_STATUS.PENDING,
  PASSWORD_RESET_STATUS.APPROVED,
  PASSWORD_RESET_STATUS.REJECTED,
  PASSWORD_RESET_STATUS.USED,
  PASSWORD_RESET_STATUS.EXPIRED,
] as const

export const ACTIVITY_CATEGORY = {
  AUTH: "auth",
  ROLE: "role",
  SECURITY: "security",
} as const

export const ACTIVITY_ACTION = {
  LOGIN: "login",
  LOGOUT: "logout",
  FAILED_LOGIN: "failed_login",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REVOKED: "role_revoked",
  ACCOUNT_LOCKED: "account_locked",
  ACCOUNT_UNLOCKED: "account_unlocked",
  TOKEN_REUSE_DETECTED: "token_reuse_detected",
} as const

export const AUTH_ERRORS = {
  MISSING_TOKEN: { message: "Authentication cookie missing or invalid", code: "UNAUTHORIZED" },
  TOKEN_EXPIRED: {
    message: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    code: "TOKEN_EXPIRED",
  },
  ACCOUNT_INACTIVE: {
    message: "Tài khoản không tồn tại hoặc không còn hoạt động.",
    code: "ACCOUNT_INACTIVE",
  },
  AUTH_ERROR: { message: "Không thể xác thực người dùng.", code: "AUTH_ERROR" },
} as const

export const PROTECTED_PERMISSIONS = process.env.PROTECTED_PERMISSIONS
  ? process.env.PROTECTED_PERMISSIONS.split(",").map((p) => p.trim())
  : ["role.update", "permission.update", "employee.role.update", "role.permission.update"]
