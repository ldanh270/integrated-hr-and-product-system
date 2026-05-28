import { useNavigate } from "react-router-dom"
import { LogOut, User as UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button.tsx"
import { useAuth } from "@/hooks/use-auth.ts"
import { useAuthStore } from "@/store/auth-store.ts"

/**
 * Global Header component
 * Displays user info and logout button when authenticated
 */
export default function Header() {
  const navigate = useNavigate()
  const { logout, isLoggingOut } = useAuth()
  const { user, isAuthenticated } = useAuthStore()

  /**
   * Logout handler
   */
  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 max-w-7xl items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            HR
          </div>
          <span className="text-xl font-bold tracking-tight">System</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <UserIcon size={20} className="text-muted-foreground" />
            </div>
            <div className="hidden flex-col md:flex">
              <span className="text-sm font-semibold">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </header>
  )
}
