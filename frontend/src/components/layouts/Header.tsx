import SubsystemDropdown from "@/components/layouts/SubsystemDropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROUTES } from "@/config/routes.config"
import { useAuth } from "@/hooks/use-auth.ts"
import { useAuthStore } from "@/store/auth-store.ts"
import { useSubsystemStore } from "@/store/subsystem-store"

import { useState } from "react"

import { Bell, History, LogOut, MessageSquare, User } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

/**
 * Header component
 * Minimalist top bar with page title, sub-tabs, notification bell, and user profile dropdown.
 */
export default function Header() {
  const navigate = useNavigate()
  const { logout, isLoggingOut } = useAuth()
  const { user, isAuthenticated } = useAuthStore()
  const { getActiveSubsystemConfig } = useSubsystemStore()
  const [activeTab, setActiveTab] = useState<"personal" | "summary">("personal")

  const activeSubsystemConfig = getActiveSubsystemConfig()

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.AUTH.LOGIN)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-border bg-background text-foreground px-6 flex items-center shadow-none">
      <div className="flex w-full items-center justify-between">
        {/* Left: title + sub-tabs */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="text-sm font-medium tracking-tight leading-none">
              {activeSubsystemConfig?.name || "Hệ thống HRP"}
            </h1>
          </div>
          {/* Sub-tabs */}
          <div className="flex items-center gap-6 text-sm mt-0.5">
            {(["personal", "summary"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-1 font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                {tab === "personal" ? "Cá nhân" : "Tổng hợp"}
              </button>
            ))}
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-4">
          <SubsystemDropdown />

          {/* Notification bell */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.5} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer">
                <div className="hidden flex-col items-end lg:flex leading-none">
                  <span className="text-sm font-medium">{user?.fullName || "Lê Đức Anh"}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {user?.role || "Nhân viên"}
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground text-xs font-medium border border-border">
                  {user?.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuLabel className="px-3 py-2 font-normal">
                <p className="text-xs text-muted-foreground">Đăng nhập với</p>
                <p className="text-sm font-medium truncate mt-1 text-foreground">
                  {user?.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="cursor-pointer gap-3 px-3 py-2">
                <Link to={ROUTES.HRM.PROFILE} className="w-full">
                  <User size={14} strokeWidth={1.5} />
                  <span>Hồ sơ cá nhân</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-3 px-3 py-2">
                <Link to="#" className="w-full">
                  <History size={14} strokeWidth={1.5} />
                  <span>Lịch sử đăng nhập</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-3 px-3 py-2">
                <Link to="#" className="w-full">
                  <MessageSquare size={14} strokeWidth={1.5} />
                  <span>Đóng góp ý kiến</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer gap-3 px-3 py-2"
              >
                <LogOut size={14} strokeWidth={1.5} />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
