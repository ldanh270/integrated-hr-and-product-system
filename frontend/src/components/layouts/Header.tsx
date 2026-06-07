import SubsystemDropdown from "@/components/layouts/SubsystemDropdown"
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
  const [showDropdown, setShowDropdown] = useState(false)

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
                    ? "text-foreground border-b border-foreground"
                    : "text-muted-foreground hover:text-foreground border-b border-transparent"
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
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-foreground" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-3 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
            >
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

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-md border border-border bg-background p-2 shadow-sm animate-fade-in z-50">
                <div className="px-3 py-3 border-b border-border mb-2">
                  <p className="text-xs text-muted-foreground">Đăng nhập với</p>
                  <p className="text-sm font-medium truncate mt-1">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    to={ROUTES.HRM.PROFILE}
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  >
                    <User size={14} strokeWidth={1.5} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    to="#"
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  >
                    <History size={14} strokeWidth={1.5} />
                    <span>Lịch sử đăng nhập</span>
                  </Link>
                  <Link
                    to="#"
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  >
                    <MessageSquare size={14} strokeWidth={1.5} />
                    <span>Đóng góp ý kiến</span>
                  </Link>
                </div>

                <div className="border-t border-border my-2"></div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={14} strokeWidth={1.5} />
                  <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
