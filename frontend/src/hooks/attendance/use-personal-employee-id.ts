import { useAuthStore } from "@/store/auth-store"

export function usePersonalEmployeeId(): string | undefined {
  const user = useAuthStore((state) => state.user)
  if (!user) return undefined

  return user.personalEmployee?.id ?? user.id
}

export function useHasPersonalEmployeeLink(): boolean {
  const user = useAuthStore((state) => state.user)
  return Boolean(user?.personalEmployee?.id)
}
