import { SYSTEM_CONFIG } from "@/config/system.config"
import { useAuthStore } from "@/store/auth-store"

import axios from "axios"
import { toast } from "sonner"

/**
 * Axios instance for API calls
 * Configured with base URL and standard headers
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

/**
 * Request interceptor to attach JWT token to headers
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * Response interceptor to handle global errors (e.g., unauthorized)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
      
      // Only treat as session expiration if the user was actually logged in (had a token)
      if (token) {
        useAuthStore.getState().clearAuth()
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
