import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/store/auth-store"

import { useMutation } from "@tanstack/react-query"

/**
 * Hook for authentication operations
 */
export const useAuth = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: Record<string, unknown>) => {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
      return data.data // Following ApiResponse envelope
    },
    onSuccess: (data: { employee: User }) => {
      setAuth(data.employee)
    },
  })

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
      return data
    },
    onSuccess: () => {
      clearAuth()
    },
    onSettled: () => {
      clearAuth() // Always clear state even if API fails
    },
  })
  /**
   * Forgot password mutation
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data)
      return response.data
    },
  })

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingForgotPassword: forgotPasswordMutation.isPending,
  }
}
