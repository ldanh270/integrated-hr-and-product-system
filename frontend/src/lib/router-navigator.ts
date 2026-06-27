import type { NavigateFunction, NavigateOptions } from "react-router-dom"

/**
 * Singleton navigator for use outside React components.
 *
 * Problem: React Router's `useNavigate()` can only be called inside React components.
 * Services like Axios interceptors, Zustand actions, or utility functions live
 * outside the React tree and cannot call hooks.
 *
 * Solution: Store the `navigate` function from `useNavigate()` in a module-level
 * ref, then read it from anywhere in the app.
 *
 * Usage:
 * 1. Inject once at the app root via the `NavigatorInjector` component (see App.tsx).
 * 2. Call `routerNavigate(path, options)` from any non-React module.
 *
 * @example — inside an Axios interceptor
 * ```ts
 * import { routerNavigate } from "@/lib/router-navigator"
 * routerNavigate(ROUTES.AUTH.LOGIN, { replace: true })
 * ```
 */
let _navigate: NavigateFunction | null = null

/**
 * Called once by `NavigatorInjector` in App.tsx to register the navigate fn.
 * Do NOT call this from anywhere else.
 */
export const setNavigate = (navigate: NavigateFunction): void => {
  _navigate = navigate
}

/**
 * Navigate programmatically from outside a React component.
 * Falls back to `window.location.href` if the navigator is not yet initialised
 * (e.g., very early app bootstrap before the router mounts).
 */
export const routerNavigate = (to: string, options?: NavigateOptions): void => {
  if (_navigate) {
    _navigate(to, options)
  } else {
    // Fallback: navigator not ready yet (should be extremely rare)
    window.location.href = to
  }
}
