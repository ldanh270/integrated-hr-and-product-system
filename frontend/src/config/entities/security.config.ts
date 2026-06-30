export const EXPORT_STATUS = {
  IDLE: "idle",
  COUNTING: "counting",
  FETCHING: "fetching",
  BUILDING: "building",
  SUCCESS: "success",
  ERROR: "error",
} as const

export type IExportStatus = (typeof EXPORT_STATUS)[keyof typeof EXPORT_STATUS]

export const ACTIVITY_ACTION_VARIANTS: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  login: "success",
  logout: "neutral",
  failed_login: "danger",
  account_locked: "danger",
  account_unlocked: "success",
  role_assigned: "success",
  role_revoked: "warning",
  password_changed: "warning",
} as const

export const SECURITY_ACTIVITY_CATEGORY = {
  SECURITY: "security",
  ROLE: "role",
  PERMISSION: "permission",
  EMPLOYEE: "employee",
} as const

export const SECURITY_AUDIT_ACTION_PREFIX = {
  ROLE: "ROLE_",
  PERMISSION: "PERMISSION_",
  EMPLOYEE: "EMPLOYEE_",
} as const

export const USERS_MANAGEMENT_TABS = {
  ALL: "all",
  LOCKED: "locked",
} as const

export type IUsersManagementTab = (typeof USERS_MANAGEMENT_TABS)[keyof typeof USERS_MANAGEMENT_TABS]
