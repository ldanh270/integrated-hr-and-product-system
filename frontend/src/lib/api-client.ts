import { SYSTEM_CONFIG } from "@/config/system.config"

import axios from "axios"

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
      // Handle unauthorized (e.g., clear store and redirect to login)
      localStorage.removeItem(SYSTEM_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
      // We'll handle redirection in the UI layer/store
    }
    return Promise.reject(error)
  },
)

export default apiClient
