import type { User } from "../store/auth-store"

/**
 * Hook for authentication operations
 */
export declare const useAuth: () => {
  login: import("@tanstack/react-query").UseMutateAsyncFunction<
    {
      employee: User
      token: string
    },
    Error,
    Record<string, unknown>,
    unknown
  >
  isLoggingIn: boolean
  loginError: Error | null
  logout: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, void, unknown>
  isLoggingOut: boolean
  forgotPassword: import("@tanstack/react-query").UseMutateAsyncFunction<
    any,
    Error,
    {
      username: string
    },
    unknown
  >
  isSendingForgotPassword: boolean
}
