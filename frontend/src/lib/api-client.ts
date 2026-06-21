import { useAuthStore } from "@/store/auth-store"

import axios from "axios"
import { toast } from "sonner"

/**
 * Axios instance for API calls
 * Configured with base URL and standard headers
 */
const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> =
  []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Public auth endpoints that must propagate their own 401 to the caller.
 * Auto-refresh on these would swallow the real error (e.g. "Invalid username or password").
 */
const PUBLIC_AUTH_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/validate-reset-token",
  "/auth/reset-password",
]

const isPublicAuthPath = (url?: string): boolean => {
  if (!url) return false
  return PUBLIC_AUTH_PATHS.some((path) => url === path || url.startsWith(`${path}?`))
}

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * Response interceptor to handle global errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !isPublicAuthPath(originalRequest?.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await apiClient.post("/auth/refresh")
        processQueue(null)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Only treat as session expiration if the user was actually logged in
        const isAuthenticated = useAuthStore.getState().isAuthenticated

        if (isAuthenticated) {
          useAuthStore.getState().clearAuth()
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
          localStorage.removeItem("auth-storage")
          window.location.href = "/login"
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
