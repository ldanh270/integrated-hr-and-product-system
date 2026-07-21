/** Non-persisted authorization bootstrap lifecycle for protected route gating. */
export const AUTHORIZATION_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
} as const

export type IAuthorizationStatus = (typeof AUTHORIZATION_STATUS)[keyof typeof AUTHORIZATION_STATUS]
