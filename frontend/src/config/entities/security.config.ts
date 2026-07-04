/**
 * Export lifecycle states used by security log export flows.
 */
export const EXPORT_STATUS = {
  IDLE: "idle",
  COUNTING: "counting",
  FETCHING: "fetching",
  BUILDING: "building",
  SUCCESS: "success",
  ERROR: "error",
} as const

/**
 * Union type of all export lifecycle states.
 */
export type IExportStatus = (typeof EXPORT_STATUS)[keyof typeof EXPORT_STATUS]

/**
 * Maps activity actions to UI badge variants for security screens.
 */
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

/**
 * High-level categories assigned to security activity records.
 */
export const SECURITY_ACTIVITY_CATEGORY = {
  SECURITY: "security",
  SYSTEM_ROLE: "role",
  PERMISSION: "permission",
  EMPLOYEE: "employee",
} as const

/**
 * Action-name prefixes used to classify audit log records by domain.
 */
export const SECURITY_AUDIT_ACTION_PREFIX = {
  SYSTEM_ROLE: "ROLE_",
  PERMISSION: "PERMISSION_",
  EMPLOYEE: "EMPLOYEE_",
} as const

/**
 * Supported scope values for security activity-log queries.
 */
export const SECURITY_QUERY_SCOPE = {
  ALL: "all",
  ME: "me",
} as const

/**
 * Union type of all supported security query scopes.
 */
export type ISecurityQueryScope = (typeof SECURITY_QUERY_SCOPE)[keyof typeof SECURITY_QUERY_SCOPE]

/**
 * Shared query-key segments for React Query caches in the security module.
 */
export const SECURITY_QUERY_KEY = {
  ROOT: "security",
  SUMMARY: "summary",
  LOCKED_ACCOUNTS: "locked-accounts",
  LOGS: "logs",
  DETAIL: "detail",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  EMPLOYEES: "employees",
} as const

/**
 * Tabs available in the users-management screen.
 */
export const USERS_MANAGEMENT_TABS = {
  ALL: "all",
  LOCKED: "locked",
} as const

/**
 * Union type of all users-management tab keys.
 */
export type IUsersManagementTab = (typeof USERS_MANAGEMENT_TABS)[keyof typeof USERS_MANAGEMENT_TABS]
