import { useMutation } from "@tanstack/react-query"
import apiClient from "@/lib/api-client.ts"
import { useAuthStore } from "@/store/auth-store.ts"

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
    mutationFn: async (credentials: any) => {
      const { data } = await apiClient.post("/auth/login", credentials)
      return data.data // Following ApiResponse envelope
    },
    onSuccess: (data: any) => {
      setAuth(data.employee, data.token)
    },
  })

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/auth/logout")
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
      const response = await apiClient.post("/auth/forgot-password", data)
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

