export const PERMISSION_ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden: Insufficient permissions",
  NOT_FOUND: "Permission not found",
  CODE_IMMUTABLE: "Permission code is immutable and cannot be modified",
  SYSTEM_UPDATE: "Cannot update system permissions",
  SYSTEM_DELETE: "Cannot delete system permission",
  ASSIGNED: "Permission is assigned to one or more roles",
} as const

export const PERMISSION_ERROR_CODES = {
  SYSTEM_PROTECTED: "SYSTEM_ROLE_PROTECTED",
  ASSIGNED: "PERMISSION_ASSIGNED",
} as const

export const PERMISSION_AUDIT_ACTIONS = {
  CREATED: "PERMISSION_CREATED",
  UPDATED: "PERMISSION_UPDATED",
  DELETED: "PERMISSION_DELETED",
  ASSIGNED: "PERMISSION_ASSIGNED",
  REVOKED: "PERMISSION_REVOKED",
  REPLACED: "PERMISSION_REPLACED",
} as const

export const PERMISSION_DECISION_REASONS = {
  DYNAMIC_ADMIN: "dynamic_admin",
  DYNAMIC_PERMISSION: "dynamic_permission",
  REQUIRE_ANY_PERMISSION: "require_any_permission",
  REQUIRE_ALL_PERMISSIONS: "require_all_permissions",
  ROLE_MATCH: "role_match",
  DENIED: "denied",
} as const
