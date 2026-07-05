/**
 * Centralized list of error codes used throughout the application.
 * Mapped to machine-readable string constants.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  INVALID_FORMULA: "INVALID_FORMULA",
  APP_ERROR: "APP_ERROR",
  INTERNAL_CRASH: "INTERNAL_CRASH",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export const ErrorMessage = {
  VALIDATION_ERROR: "Validation error",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  CONFLICT: "Conflict",
  INTERNAL_SERVER_ERROR: "Internal server error",
  BAD_REQUEST: "Bad request",
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

export const ErrorLayer = {
  SERVICE: "SERVICE",
  CONTROLLER: "CONTROLLER",
  REPOSITORY: "REPOSITORY",
  MIDDLEWARE: "MIDDLEWARE",
  VALIDATION: "VALIDATION",
  UNKNOWN: "UNKNOWN",
} as const

export type ErrorLayerType = (typeof ErrorLayer)[keyof typeof ErrorLayer]
