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
  isAuthenticated: boolean
  setAuth: (user: Partial<User> & { id: string; email: string; fullName: string }) => void
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
      isAuthenticated: false,
      setAuth: (user) => {
        const roles = user.roles || (user.role ? [user.role] : [])
        const permissions = user.permissions || []
        set({
          user: {
            ...user,
            roles,
            permissions,
          } as User,
          isAuthenticated: true,
        })
      },
      clearAuth: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)
