export const HttpStatusCode = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server errors
  INTERNAL_SERVER_ERROR: 500,
} as const

export type HttpStatusCodeType = (typeof HttpStatusCode)[keyof typeof HttpStatusCode]

export const RESPONSE_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
} as const

export type ResponseStatusType = (typeof RESPONSE_STATUS)[keyof typeof RESPONSE_STATUS]
