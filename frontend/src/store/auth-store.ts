import { AUTHORIZATION_STATUS, type IAuthorizationStatus } from "@/config/entities/auth.config"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  id: string
  email: string
  fullName: string
  role?: string
  roles: string[]
  permissions: string[]
  personalEmployeeId?: string | null
  personalEmployee?: {
    id: string
    fullName: string
    email: string
  } | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  authorizationStatus: IAuthorizationStatus
  beginAuthorization: () => void
  failAuthorization: () => void
  retryAuthorization: () => void
  setAuth: (
    user: Partial<User> & { id: string; email: string; fullName: string },
    accessToken?: string,
  ) => void
  clearAuth: () => void
}

/**
 * Zustand store for authentication state
 * Persists data in localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      // Never persisted: every full reload must refresh roles/permissions from /auth/me.
      authorizationStatus: AUTHORIZATION_STATUS.IDLE,
      beginAuthorization: () => set({ authorizationStatus: AUTHORIZATION_STATUS.LOADING }),
      failAuthorization: () => set({ authorizationStatus: AUTHORIZATION_STATUS.ERROR }),
      retryAuthorization: () => set({ authorizationStatus: AUTHORIZATION_STATUS.IDLE }),
      setAuth: (user, accessToken) => {
        const roles = user.roles || (user.role ? [user.role] : [])
        const permissions = user.permissions || []
        set((state) => ({
          user: {
            ...user,
            roles,
            permissions,
          } as User,
          accessToken: accessToken ?? state.accessToken,
          isAuthenticated: true,
          authorizationStatus: AUTHORIZATION_STATUS.READY,
        }))
      },
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          authorizationStatus: AUTHORIZATION_STATUS.READY,
        })
      },
    }),
    {
      name: "auth-storage",
      partialize: ({ user, accessToken, isAuthenticated }) => ({
        user,
        accessToken,
        isAuthenticated,
      }),
    },
  ),
)
